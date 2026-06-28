import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing credentials in env.")
  process.exit(1)
}

const db = createClient(url, serviceKey)

async function run() {
  // Query table columns using Postgres catalog or direct API select
  // We can query a dummy row to inspect returned keys
  const { data, error } = await db.from('users_profile').select('*').limit(1)
  if (error) {
    console.error("Error querying users_profile:", error)
  } else {
    console.log("Dummy row keys:", data && data[0] ? Object.keys(data[0]) : "No rows found")
  }
}

run().catch(console.error)
