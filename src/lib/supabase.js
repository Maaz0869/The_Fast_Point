import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase client for The Snack Hut.
//
// The URL + anon key are safe to ship in the browser: the anon key only grants
// what Row Level Security allows. We read them from Vite env vars when present
// (recommended for deploys) and fall back to the project defaults so the app
// works out of the box locally and on Vercel without extra setup.
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://xrqhfwfukkpcmhmjjzxp.supabase.co'

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycWhmd2Z1a2twY21obWpqenhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODY0MzAsImV4cCI6MjA5OTk2MjQzMH0.PVMElJxH1wbvx84alE2_Dpz1wgJOegRBlOaNupR_b2o'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})
