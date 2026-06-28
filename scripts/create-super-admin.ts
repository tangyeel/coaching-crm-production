/**
 * One-time script: creates the single platform super admin.
 * Usage: npx tsx scripts/create-super-admin.ts
 * Change email/password before running.
 */
import 'dotenv/config'
import { Client, Databases, Users, ID } from 'node-appwrite'

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID!
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!

const SUPER_ADMIN_EMAIL    = process.env.SUPER_ADMIN_EMAIL ?? 'admin@coachingcrm.com'
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? 'admin@123'
const SUPER_ADMIN_NAME     = process.env.SUPER_ADMIN_NAME ?? 'Platform Admin'

const DB_ID = 'coaching-crm'

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY)

const users = new Users(client)
const db = new Databases(client)

async function main() {
  // Check if super admin already exists
  const existing = await db.listDocuments(DB_ID, 'users_profile', [])
  const alreadyExists = existing.documents.find(d => d.role === 'SUPER_ADMIN')
  if (alreadyExists) {
    console.log('⚠️  Super admin already exists:', alreadyExists.email)
    process.exit(0)
  }

  // Create Appwrite auth user
  const user = await users.create(ID.unique(), SUPER_ADMIN_EMAIL, undefined, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME)
  console.log('✓ Auth user created:', user.$id)

  // Create profile document
  await db.createDocument(DB_ID, 'users_profile', ID.unique(), {
    user_id: user.$id,
    institute_id: null,
    role: 'SUPER_ADMIN',
    name: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_EMAIL,
    phone: null,
    requires_password_change: false,
    is_active: true,
    fee_status: null,
    guardian_name: null,
    guardian_phone: null,
    subject: null,
    parent_id: null,
  })
  console.log('✓ Profile created')
  console.log('\n✅ Super admin ready!')
  console.log(`   Email:    ${SUPER_ADMIN_EMAIL}`)
  console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`)
  console.log('\n⚠️  Change the password after first login!')
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1) })
