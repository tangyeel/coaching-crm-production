import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing supabase credentials in env.")
  process.exit(1)
}

const db = createClient(url, serviceKey)

async function run() {
  console.log("Supabase connected.")

  // 1. Institutes
  const { data: insts } = await db.from('institutes').select('*')
  console.log("\n--- Institutes ---")
  console.log(insts)

  // 2. Batches
  const { data: batches } = await db.from('batches').select('*')
  console.log("\n--- Batches ---")
  console.log(batches)

  // 3. Roster counts per role
  const { data: profiles } = await db.from('users_profile').select('id, name, email, role, institute_id')
  console.log("\n--- Users Profile count ---", profiles?.length)
  
  const counts: Record<string, number> = {}
  profiles?.forEach(p => {
    const key = `${p.institute_id} - ${p.role}`
    counts[key] = (counts[key] || 0) + 1
  })
  console.log(counts)

  console.log("\n--- All user emails and roles ---")
  profiles?.forEach(p => {
    console.log(`Name: ${p.name}, Email: ${p.email}, Role: ${p.role}, Inst: ${p.institute_id}`)
  })
}

run().catch(console.error)
