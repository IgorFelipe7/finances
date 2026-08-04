import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project credentials.',
  )
}

// TODO: swap to `createClient<Database>(...)` once DB types are generated
// via `supabase gen types typescript` against the linked project.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
