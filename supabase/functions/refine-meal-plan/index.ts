import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { getResponseHeaders, getCorsHeaders } from "../_shared/cors.ts"
import { sanitizeErrorMessage, logError, checkMemoryRateLimit } from "../_shared/security.ts"
import { validateMealPlan, validateSwapRequest } from "../_shared/schemas.ts"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

// Rate limit: 10 refinements per hour per user
const RATE_LIMIT_MAX = 10
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
        const rateLimitKey = `refine-meal:${user.id}`
        const rateLimit = checkMemoryRateLimit(rateLimitKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
        if (!rateLimit.allowed) {
            throw new Error('Rate limit exceeded')
        }

        // Parse and validate request body
        const rawBody = await req.json()
        const bodyValidation = validateSwapRequest(rawBody)
        if (!bodyValidation.success) {
            throw new Error(bodyValidation.error)
        }
        const { planId, mealIndex, comments } = bodyValidation.data!

        // Fetch the existing plan (RLS ensures user can only access their own)
        const { data: existingPlan, error: fetchError } = await supabaseClient
            .from('ai_meal_plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (fetchError || !existingPlan) {
            throw new Error('Meal plan not found')
        }

        // Validate meal index
        if (!existingPlan.meals || !existingPlan.meals[mealIndex]) {
            throw new Error('Invalid meal selection')
        }

        // Fetch user's macro targets
        const { data: macros } = await supabaseClient
            .from('macro_targets')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!macros) {
            throw new Error('Macro targets not set')
        }

        const currentMeal = existingPlan.meals[mealIndex]

        // Prepare prompt for AI
        const systemPrompt = `You are an elite sports nutritionist. The user wants to swap one meal in their plan.

Current meal to replace:
- Name: ${currentMeal.name}
- Calories: ${currentMeal.calories} kcal
- Protein: ${currentMeal.protein}g
- Carbs: ${currentMeal.carbs}g
- Fats: ${currentMeal.fats}g

User's feedback: "${comments}"

Generate a SINGLE replacement meal that:
1. Matches the same macro targets (within +/- 10%)
2. Addresses the user's feedback
3. Is different from the original meal

Return ONLY valid JSON with this structure (no markdown):
{
  "meal": {
    "name": "New Meal Name",
    "protein": 0,
    "carbs": 0,
    "fats": 0,
    "calories": 0,
    "ingredients": [
      { "name": "Ingredient", "amount": "100g" }
    ],
    "instructions": "Brief instructions."
  }
}`

        if (!OPENAI_API_KEY) {
            logError('refine-meal-plan', new Error('OPENAI_API_KEY not configured'))
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
                    { role: 'user', content: 'Generate the replacement meal.' }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            logError('refine-meal-plan', new Error('OpenAI API error'), { status: response.status, body: errorText })
            throw new Error('AI service temporarily unavailable')
        }

        const aiData = await response.json()
        const content = aiData.choices[0].message.content

        // Parse and validate the AI response
        let rawResponse: unknown
        try {
            rawResponse = JSON.parse(content)
        } catch {
            logError('refine-meal-plan', new Error('AI returned invalid JSON'), { content })
            throw new Error('AI service returned invalid data')
        }

        // Validate the single meal response
        const singleMealWrapper = { meals: [(rawResponse as { meal: unknown }).meal] }
        const validationResult = validateMealPlan(singleMealWrapper)
        if (!validationResult.success) {
            logError('refine-meal-plan', new Error('AI response validation failed'), {
                error: validationResult.error,
                rawResponse
            })
            throw new Error('AI service returned invalid data')
        }

        const newMeal = validationResult.data!.meals[0]

        // Update the meal in the plan
        const updatedMeals = [...existingPlan.meals]
        updatedMeals[mealIndex] = newMeal

        // Save to database
        const { error: updateError } = await supabaseClient
            .from('ai_meal_plans')
            .update({
                meals: updatedMeals,
                updated_at: new Date().toISOString()
            })
            .eq('id', planId)

        if (updateError) {
            logError('refine-meal-plan', updateError, { planId, mealIndex })
            throw new Error('Failed to save updated plan')
        }

        // Record feedback for future improvement
        await supabaseClient.from('meal_plan_feedback').insert({
            plan_id: planId,
            user_id: user.id,
            meal_index: mealIndex,
            feedback_type: 'swap_request',
            comments: comments,
        }).catch(() => {
            // Non-critical, just log
            console.warn('Failed to record meal feedback')
        })

        return new Response(JSON.stringify({ updated_meals: updatedMeals }), {
            headers,
            status: 200,
        })

    } catch (error) {
        logError('refine-meal-plan', error)
        return new Response(JSON.stringify({ error: sanitizeErrorMessage(error) }), {
            headers,
            status: 400,
        })
    }
})
