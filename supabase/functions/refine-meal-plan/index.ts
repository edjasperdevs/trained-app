import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { corsHeaders } from "../_shared/cors.ts"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const { planId, mealIndex, comments } = await req.json()

        if (!planId || mealIndex === undefined) {
            throw new Error('Missing planId or mealIndex')
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // Fetch existing plan
        const { data: plan, error: planError } = await supabaseClient
            .from('ai_meal_plans')
            .select('*')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

        if (planError || !plan) throw new Error('Plan not found')

        // Save the feedback
        await supabaseClient.from('meal_plan_feedback').insert({
            plan_id: planId,
            user_id: user.id,
            meal_index: mealIndex,
            feedback_type: 'swap_request',
            comments: comments || ''
        })

        const [macroRes, prefsRes] = await Promise.all([
            supabaseClient.from('macro_targets').select('*').eq('user_id', user.id).single(),
            supabaseClient.from('user_food_preferences').select('*').eq('user_id', user.id).single()
        ])

        const macros = macroRes.data
        const prefs = prefsRes.data
        const mealToReplace = plan.meals[mealIndex]

        const systemPrompt = `You are an elite sports nutritionist. The user wants to replace one specific meal from their daily plan.
Meal to replace:
${JSON.stringify(mealToReplace, null, 2)}

User's reason for swap/feedback: "${comments || 'None provided'}"

Constraints:
- Generate exactly ONE meal to replace it.
- Try to perfectly hit the original meal's macros: ${mealToReplace.calories} kcal, ${mealToReplace.protein}g protein, ${mealToReplace.carbs}g carbs, ${mealToReplace.fats}g fats.
- Adhere to any restrictions: ${prefs?.allergies?.join(', ') || 'None'}, ${prefs?.dietary_restrictions?.join(', ') || 'None'}.
- JSON output ONLY, matching this structure:
{
  "name": "New Meal Name",
  "protein": 0,
  "carbs": 0,
  "fats": 0,
  "calories": 0,
  "ingredients": [{ "name": "Ingredient 1", "amount": "100g" }],
  "instructions": "Brief instructions."
}`

        if (!OPENAI_API_KEY) throw new Error('OpenAI API key missing')

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt }],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        })

        if (!response.ok) throw new Error(`OpenAI error: ${response.statusText}`)

        const aiData = await response.json()
        const content = aiData.choices[0].message.content
        const newMeal = JSON.parse(content)

        // Update the plan in DB
        const updatedMeals = [...plan.meals]
        updatedMeals[mealIndex] = newMeal

        const { error: updateError } = await supabaseClient
            .from('ai_meal_plans')
            .update({ meals: updatedMeals })
            .eq('id', planId)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ plan_id: planId, updated_meals: updatedMeals }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error refining meal:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
