import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Create user-context client to verify caller identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Create admin client with service role for data deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const userId = user.id

    // 4. Delete storage objects from intake-photos bucket (user's folder)
    const { data: files } = await supabaseAdmin.storage
      .from('intake-photos')
      .list(userId)

    if (files && files.length > 0) {
      const filePaths = files.map((f) => `${userId}/${f.name}`)
      await supabaseAdmin.storage.from('intake-photos').remove(filePaths)
    }

    // 5. Delete from ALL user data tables in dependency-safe order (children first)
    const deletions: Array<{ table: string; column: string }> = [
      { table: 'device_tokens', column: 'user_id' },
      { table: 'workout_logs', column: 'user_id' },
      { table: 'daily_macro_logs', column: 'user_id' },
      { table: 'logged_meals', column: 'user_id' },
      { table: 'saved_meals', column: 'user_id' },
      { table: 'user_foods', column: 'user_id' },
      { table: 'weight_logs', column: 'user_id' },
      { table: 'user_xp', column: 'user_id' },
      { table: 'weekly_checkins', column: 'client_id' },
      { table: 'assigned_workouts', column: 'client_id' },
      { table: 'coach_clients', column: 'client_id' },
      { table: 'macro_targets', column: 'user_id' },
      { table: 'profiles', column: 'id' },
    ]

    for (const { table, column } of deletions) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId)

      if (error) {
        console.error(`Failed to delete from ${table}:`, error.message)
        // Continue with other deletions -- best-effort cleanup
      }
    }

    // 6. Delete the auth user as the final step
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      return new Response(JSON.stringify({ error: `Failed to delete auth user: ${deleteUserError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
