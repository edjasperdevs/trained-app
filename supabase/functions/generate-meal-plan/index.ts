import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { getResponseHeaders, getCorsHeaders } from "../_shared/cors.ts"
import { sanitizeErrorMessage, logError, checkMemoryRateLimit } from "../_shared/security.ts"
import { validateMealPlan } from "../_shared/schemas.ts"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

// Rate limit: 5 meal plan generations per hour per user
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: getCorsHeaders(req) })
    }

    const headers = getResponseHeaders(req)

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // Get user from auth token
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            throw new Error('Not authenticated')
        }

        // Rate limiting
        const rateLimitKey = `meal-plan:${user.id}`
        const rateLimit = checkMemoryRateLimit(rateLimitKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
        if (!rateLimit.allowed) {
            throw new Error('Rate limit exceeded')
        }

        // Fetch user's macro targets and preferences
        const [macroRes, prefsRes] = await Promise.all([
            supabaseClient.from('macro_targets').select('*').eq('user_id', user.id).single(),
            supabaseClient.from('user_food_preferences').select('*').eq('user_id', user.id).single()
        ])

        const macros = macroRes.data
        const prefs = prefsRes.data

        if (!macros) {
            throw new Error('Macro targets not set')
        }

        // Validate macro values are reasonable
        if (macros.calories < 500 || macros.calories > 10000) {
            throw new Error('Macro targets not set')
        }

        // Prepare context for AI
        const systemPrompt = `You are an elite sports nutritionist creating a meal plan for an athlete.
Your goal is to generate a realistic, simple, single-day meal plan that hits these exact macro targets within a +/- 5% margin:
- Calories: ${macros.calories} kcal
- Protein: ${macros.protein}g
- Carbs: ${macros.carbs}g
- Fats: ${macros.fats}g

User Preferences:
- Cuisines: ${prefs?.cuisines?.join(', ') || 'Any'}
- Dietary Restrictions: ${prefs?.dietary_restrictions?.join(', ') || 'None'}
- Liked Foods: ${prefs?.liked_foods?.join(', ') || 'Any'}
- Disliked Foods: ${prefs?.disliked_foods?.join(', ') || 'None'}
- Allergies: ${prefs?.allergies?.join(', ') || 'None'}

Constraints:
1. Divide into 3-5 distinct meals.
2. Keep recipes simple; no obscure ingredients.
3. Your output MUST be valid JSON matching this structure perfectly. Include NO markdown wrappers or extra text:
{
  "meals": [
    {
      "name": "Meal Name",
      "protein": 0,
      "carbs": 0,
      "fats": 0,
      "calories": 0,
      "ingredients": [
        { "name": "Ingredient 1", "amount": "100g" }
      ],
      "instructions": "Brief instructions."
    }
  ],
  "daily_totals": {
    "protein": 0,
    "carbs": 0,
    "fats": 0,
    "calories": 0
  }
}`

        if (!OPENAI_API_KEY) {
            logError('generate-meal-plan', new Error('OPENAI_API_KEY not configured'))
            throw new Error('AI service not configured')
        }

        // Call OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Generate my daily meal plan.' }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            logError('generate-meal-plan', new Error('OpenAI API error'), { status: response.status, body: errorText })
            throw new Error('AI service temporarily unavailable')
        }

        const aiData = await response.json()
        const content = aiData.choices[0].message.content

        // Parse and validate the AI response
        let rawPlan: unknown
        try {
            rawPlan = JSON.parse(content)
        } catch {
            logError('generate-meal-plan', new Error('AI returned invalid JSON'), { content })
            throw new Error('AI service returned invalid data')
        }

        // Validate and sanitize the meal plan
        const validationResult = validateMealPlan(rawPlan)
        if (!validationResult.success) {
            logError('generate-meal-plan', new Error('AI response validation failed'), {
                error: validationResult.error,
                rawPlan
            })
            throw new Error('AI service returned invalid data')
        }

        return new Response(JSON.stringify(validationResult.data), {
            headers,
            status: 200,
        })

    } catch (error) {
        logError('generate-meal-plan', error)
        return new Response(JSON.stringify({ error: sanitizeErrorMessage(error) }), {
            headers,
            status: 400,
        })
    }
})
