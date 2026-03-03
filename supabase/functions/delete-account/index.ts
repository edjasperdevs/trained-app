import { getResponseHeaders, getCorsHeaders } from '../_shared/cors.ts'
import { sanitizeErrorMessage, logError } from '../_shared/security.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  const headers = getResponseHeaders(req)

  try {
    // 1. Extract auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers,
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
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers,
      })
    }

    const userId = user.id

    // 3. Log this sensitive operation for audit trail
    console.log(`Account deletion initiated for user: ${userId}`)

    // 4. Create admin client with service role for data deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 5. Record in audit log before deletion
    await supabaseAdmin.from('audit_log').insert({
      user_id: userId,
      action: 'account_deletion_initiated',
      resource_type: 'user',
      resource_id: userId,
      metadata: {
        email: user.email,
        requested_at: new Date().toISOString(),
      },
    }).catch(() => {
      // Non-critical, continue with deletion
      console.warn('Failed to create audit log entry')
    })

    // 6. Delete storage objects from intake-photos bucket (user's folder)
    const { data: files } = await supabaseAdmin.storage
      .from('intake-photos')
      .list(userId)

    if (files && files.length > 0) {
      const filePaths = files.map((f) => `${userId}/${f.name}`)
      await supabaseAdmin.storage.from('intake-photos').remove(filePaths)
    }

    // 7. Delete from ALL user data tables in dependency-safe order (children first)
    const deletions: Array<{ table: string; column: string }> = [
      { table: 'device_tokens', column: 'user_id' },
      { table: 'rate_limits', column: 'user_id' },
      { table: 'health_data_consent', column: 'user_id' },
      { table: 'meal_plan_feedback', column: 'user_id' },
      { table: 'ai_meal_plans', column: 'user_id' },
      { table: 'user_food_preferences', column: 'user_id' },
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
      { table: 'subscriptions', column: 'user_id' },
      // audit_log left intentionally for compliance - user_id set to null by FK
      { table: 'profiles', column: 'id' },
    ]

    const deletionErrors: string[] = []
    for (const { table, column } of deletions) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId)

      if (error) {
        console.error(`Failed to delete from ${table}:`, error.message)
        deletionErrors.push(table)
        // Continue with other deletions -- best-effort cleanup
      }
    }

    if (deletionErrors.length > 0) {
      console.warn(`Partial deletion - failed tables: ${deletionErrors.join(', ')}`)
    }

    // 8. Revoke all refresh tokens before deleting user
    await supabaseAdmin.auth.admin.signOut(userId, 'global').catch(() => {
      // Non-critical
      console.warn('Failed to revoke sessions')
    })

    // 9. Delete the auth user as the final step
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      logError('delete-account', deleteUserError, { userId })
      return new Response(JSON.stringify({ error: 'Failed to delete account. Please contact support.' }), {
        status: 500,
        headers,
      })
    }

    console.log(`Account deletion completed for user: ${userId}`)

    return new Response(JSON.stringify({ success: true }), { headers })
  } catch (error) {
    logError('delete-account', error)
    return new Response(JSON.stringify({ error: sanitizeErrorMessage(error) }), {
      status: 500,
      headers,
    })
  }
})
