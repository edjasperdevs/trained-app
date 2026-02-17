#!/usr/bin/env node

/**
 * Fetches intake submission data from Supabase by client name or email.
 * Usage: node --env-file=.env.local scripts/fetch-intake.js "John Smith"
 *        node --env-file=.env.local scripts/fetch-intake.js "john@example.com"
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set')
  console.error('Run with: node --env-file=.env.local scripts/fetch-intake.js "<name>"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchIntake(searchTerm) {
  // Try exact email match first
  let { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .ilike('email', searchTerm)
    .limit(1)

  // If no email match, try name search
  if (!data || data.length === 0) {
    const result = await supabase
      .from('intake_submissions')
      .select('*')
      .ilike('full_name', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(1)

    data = result.data
    error = result.error
  }

  if (error) {
    console.error('Error fetching intake:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.error(`No intake submission found for: ${searchTerm}`)
    process.exit(1)
  }

  // Output as JSON
  console.log(JSON.stringify(data[0], null, 2))
}

const searchTerm = process.argv[2]

if (!searchTerm) {
  console.error('Usage: node --env-file=.env.local scripts/fetch-intake.js "<name or email>"')
  process.exit(1)
}

fetchIntake(searchTerm)
