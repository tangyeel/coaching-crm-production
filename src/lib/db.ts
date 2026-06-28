import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side admin client (bypasses RLS)
const globalForSupa = globalThis as unknown as { _supa?: ReturnType<typeof createClient<Database>> }
export const db = globalForSupa._supa ?? createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
if (process.env.NODE_ENV !== 'production') globalForSupa._supa = db

// Public anon client for browser-side (used only if needed)
export const anonClient = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
})
