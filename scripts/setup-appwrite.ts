/**
 * Appwrite collection setup script.
 * Run once: npx tsx scripts/setup-appwrite.ts
 * Creates all collections, attributes, and indexes for CoachOS.
 */
import 'dotenv/config'
import { Client, Databases, IndexType } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const db = new Databases(client)
const DB_ID = 'coaching-crm'

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function createCollection(id: string, name: string) {
  try {
    await db.createCollection(DB_ID, id, name, undefined, undefined, true)
    console.log(`✓ Collection: ${id}`)
  } catch (e: any) {
    if (e.code === 409) console.log(`  skip (exists): ${id}`)
    else throw e
  }
}

async function str(collId: string, key: string, size = 255, required = false, def?: string) {
  try {
    await db.createStringAttribute(DB_ID, collId, key, size, required, required ? undefined : def)
    await sleep(300)
  } catch (e: any) { if (e.code !== 409 && e.type !== 'attribute_limit_exceeded') throw e }
}

async function bool(collId: string, key: string, required = false, def?: boolean) {
  try {
    await db.createBooleanAttribute(DB_ID, collId, key, required, required ? undefined : def)
    await sleep(300)
  } catch (e: any) { if (e.code !== 409 && e.type !== 'attribute_limit_exceeded') throw e }
}

async function num(collId: string, key: string, required = false, def?: number) {
  try {
    await db.createFloatAttribute(DB_ID, collId, key, required, undefined, undefined, required ? undefined : def)
    await sleep(300)
  } catch (e: any) { if (e.code !== 409 && e.type !== 'attribute_limit_exceeded') throw e }
}

async function integer(collId: string, key: string, required = false, def?: number) {
  try {
    await db.createIntegerAttribute(DB_ID, collId, key, required, undefined, undefined, required ? undefined : def)
    await sleep(300)
  } catch (e: any) { if (e.code !== 409 && e.type !== 'attribute_limit_exceeded') throw e }
}

async function idx(collId: string, key: string, type: IndexType, attrs: string[]) {
  try {
    await db.createIndex(DB_ID, collId, key, type, attrs)
    await sleep(300)
  } catch (e: any) { if (e.code !== 409 && e.type !== 'attribute_limit_exceeded') throw e }
}

async function setupDatabase() {
  // Create database (skip if exists)
  try {
    await db.create(DB_ID, 'CoachOS CRM')
    console.log('✓ Database: coaching-crm')
  } catch (e: any) {
    if (e.code === 409 || e.code === 403) console.log('  skip (exists or limit): database')
    else throw e
  }

  // ── 1. institutes ─────────────────────────────────────────────
  await createCollection('institutes', 'Institutes')
  await str('institutes', 'name', 255, true)
  await str('institutes', 'email', 255, true)
  await str('institutes', 'phone', 50)
  await str('institutes', 'status', 20, true)        // ACTIVE | SUSPENDED
  await str('institutes', 'plan', 20, true)           // BASIC | PRO | ENTERPRISE
  await num('institutes', 'monthly_fee', false, 0)
  await str('institutes', 'whatsapp_token', 1000)
  await str('institutes', 'whatsapp_phone_id', 255)
  await str('institutes', 'join_code', 20)
  await str('institutes', 'address', 500)
  await str('institutes', 'admin_name', 255)
  await str('institutes', 'admin_email', 255)
  await str('institutes', 'admin_phone', 50)
  await idx('institutes', 'idx_join_code', IndexType.Unique, ['join_code'])
  console.log('  ✓ institutes attributes done')

  // ── 2. users_profile ──────────────────────────────────────────
  await createCollection('users_profile', 'Users Profile')
  await str('users_profile', 'user_id', 255, true)   // Appwrite Auth user ID
  await str('users_profile', 'institute_id', 255)
  await str('users_profile', 'role', 30, true)        // SUPER_ADMIN|INSTITUTE_ADMIN|TEACHER|STUDENT|PARENT
  await str('users_profile', 'name', 255, true)
  await str('users_profile', 'email', 255, true)
  await str('users_profile', 'phone', 50)
  await bool('users_profile', 'requires_password_change', true, false)
  await bool('users_profile', 'is_active', true, true)
  // Student-specific
  await str('users_profile', 'guardian_name', 255)
  await str('users_profile', 'guardian_phone', 50)
  await str('users_profile', 'fee_status', 10)        // PAID | DUE
  await str('users_profile', 'parent_id', 255)        // user_id of parent
  // Teacher-specific
  await str('users_profile', 'subject', 255)
  await idx('users_profile', 'idx_user_id', IndexType.Unique, ['user_id'])
  await idx('users_profile', 'idx_institute_role', IndexType.Key, ['institute_id', 'role'])
  console.log('  ✓ users_profile attributes done')

  // ── 3. batches ────────────────────────────────────────────────
  await createCollection('batches', 'Batches')
  await str('batches', 'institute_id', 255, true)
  await str('batches', 'name', 255, true)
  await str('batches', 'subject', 255, true)
  await str('batches', 'schedule', 255, true)
  await integer('batches', 'capacity', true, 30)
  await str('batches', 'teacher_id', 255)             // profile $id
  await str('batches', 'join_code', 20)
  await bool('batches', 'is_active', true, true)
  await idx('batches', 'idx_institute', IndexType.Key, ['institute_id'])
  await idx('batches', 'idx_join_code', IndexType.Unique, ['join_code'])
  console.log('  ✓ batches attributes done')

  // ── 4. batch_students ─────────────────────────────────────────
  await createCollection('batch_students', 'Batch Students')
  await str('batch_students', 'batch_id', 255, true)
  await str('batch_students', 'student_id', 255, true) // profile $id
  await str('batch_students', 'enrolled_at', 30, true)
  await idx('batch_students', 'idx_batch', IndexType.Key, ['batch_id'])
  await idx('batch_students', 'idx_student', IndexType.Key, ['student_id'])
  await idx('batch_students', 'idx_batch_student', IndexType.Unique, ['batch_id', 'student_id'])
  console.log('  ✓ batch_students attributes done')

  // ── 5. exams ──────────────────────────────────────────────────
  await createCollection('exams', 'Exams')
  await str('exams', 'batch_id', 255, true)
  await str('exams', 'institute_id', 255, true)
  await str('exams', 'name', 255, true)
  await num('exams', 'max_marks', true)
  await str('exams', 'date', 20, true)                // ISO date string
  await idx('exams', 'idx_batch', IndexType.Key, ['batch_id'])
  console.log('  ✓ exams attributes done')

  // ── 6. marks ──────────────────────────────────────────────────
  await createCollection('marks', 'Marks')
  await str('marks', 'exam_id', 255, true)
  await str('marks', 'student_id', 255, true)         // profile $id
  await str('marks', 'institute_id', 255, true)
  await num('marks', 'score', true)                   // -1 = absent (AB)
  await str('marks', 'remarks', 1000)
  await idx('marks', 'idx_exam', IndexType.Key, ['exam_id'])
  await idx('marks', 'idx_student', IndexType.Key, ['student_id'])
  await idx('marks', 'idx_exam_student', IndexType.Unique, ['exam_id', 'student_id'])
  console.log('  ✓ marks attributes done')

  // ── 7. attendance ─────────────────────────────────────────────
  await createCollection('attendance', 'Attendance')
  await str('attendance', 'batch_id', 255, true)
  await str('attendance', 'student_id', 255, true)    // profile $id
  await str('attendance', 'institute_id', 255, true)
  await str('attendance', 'date', 20, true)            // ISO date
  await str('attendance', 'status', 10, true)          // PRESENT|ABSENT|LATE
  await str('attendance', 'marked_by_id', 255)
  await idx('attendance', 'idx_batch_date', IndexType.Key, ['batch_id', 'date'])
  await idx('attendance', 'idx_student', IndexType.Key, ['student_id'])
  await idx('attendance', 'idx_batch_student_date', IndexType.Unique, ['batch_id', 'student_id', 'date'])
  console.log('  ✓ attendance attributes done')

  // ── 8. announcements ──────────────────────────────────────────
  await createCollection('announcements', 'Announcements')
  await str('announcements', 'institute_id', 255, true)
  await str('announcements', 'batch_id', 255)
  await str('announcements', 'title', 500, true)
  await str('announcements', 'body', 10000, true)
  await str('announcements', 'author_id', 255)
  await idx('announcements', 'idx_institute', IndexType.Key, ['institute_id'])
  console.log('  ✓ announcements attributes done')

  // ── 9. fee_payments ───────────────────────────────────────────
  await createCollection('fee_payments', 'Fee Payments')
  await str('fee_payments', 'student_id', 255, true)  // profile $id
  await str('fee_payments', 'institute_id', 255, true)
  await num('fee_payments', 'amount', true)
  await str('fee_payments', 'method', 10, true)        // CASH|ONLINE
  await str('fee_payments', 'invoice_id', 255)
  await str('fee_payments', 'note', 1000)
  await str('fee_payments', 'recorded_by_id', 255)
  await str('fee_payments', 'paid_at', 30, true)
  await idx('fee_payments', 'idx_institute', IndexType.Key, ['institute_id'])
  await idx('fee_payments', 'idx_student', IndexType.Key, ['student_id'])
  console.log('  ✓ fee_payments attributes done')

  // ── 10. invoices ──────────────────────────────────────────────
  await createCollection('invoices', 'Invoices')
  await str('invoices', 'institute_id', 255, true)
  await str('invoices', 'student_id', 255, true)      // profile $id
  await str('invoices', 'status', 20, true)            // DRAFT|ISSUED|PAID|CANCELLED
  await str('invoices', 'due_date', 20, true)
  await num('invoices', 'total_amount', true)
  await str('invoices', 'items_json', 100000)          // JSON string of items array
  await idx('invoices', 'idx_institute', IndexType.Key, ['institute_id'])
  await idx('invoices', 'idx_student', IndexType.Key, ['student_id'])
  console.log('  ✓ invoices attributes done')

  // ── 11. payments (platform) ───────────────────────────────────
  await createCollection('payments', 'Platform Payments')
  await str('payments', 'institute_id', 255, true)
  await num('payments', 'amount', true)
  await str('payments', 'period_month', 10, true)
  await str('payments', 'paid_at', 30, true)
  await idx('payments', 'idx_institute', IndexType.Key, ['institute_id'])
  console.log('  ✓ payments attributes done')

  // ── 12. rate_limits ───────────────────────────────────────────
  await createCollection('rate_limits', 'Rate Limits')
  await str('rate_limits', 'key', 255, true)
  await integer('rate_limits', 'count', true, 0)
  await str('rate_limits', 'expires_at', 30, true)
  await idx('rate_limits', 'idx_key', IndexType.Unique, ['key'])
  console.log('  ✓ rate_limits attributes done')

  // ── 13. password_reset_tokens ─────────────────────────────────
  await createCollection('password_reset_tokens', 'Password Reset Tokens')
  await str('password_reset_tokens', 'token', 128, true)
  await str('password_reset_tokens', 'user_id', 255, true)  // profile $id
  await str('password_reset_tokens', 'expires_at', 30, true)
  await idx('password_reset_tokens', 'idx_token', IndexType.Unique, ['token'])
  console.log('  ✓ password_reset_tokens attributes done')

  // ── 14. notification_queue ────────────────────────────────────
  await createCollection('notification_queue', 'Notification Queue')
  await str('notification_queue', 'institute_id', 255, true)
  await str('notification_queue', 'recipient', 50, true)
  await str('notification_queue', 'type', 20, true)    // MARKS|ABSENT
  await str('notification_queue', 'payload', 10000, true)
  await str('notification_queue', 'status', 20, true)  // PENDING|SENT|FAILED
  await idx('notification_queue', 'idx_institute_status', IndexType.Key, ['institute_id', 'status'])
  console.log('  ✓ notification_queue attributes done')

  // ── 15. audit_logs ────────────────────────────────────────────
  await createCollection('audit_logs', 'Audit Logs')
  await str('audit_logs', 'institute_id', 255, true)
  await str('audit_logs', 'user_id', 255, true)
  await str('audit_logs', 'action', 100, true)
  await str('audit_logs', 'entity', 100, true)
  await str('audit_logs', 'entity_id', 255)
  await str('audit_logs', 'details', 10000)
  await idx('audit_logs', 'idx_institute', IndexType.Key, ['institute_id'])
  console.log('  ✓ audit_logs attributes done')

  // ── 16. invite_codes ───────────────────────────────────────────
  await createCollection('invite_codes', 'Invite Codes')
  await str('invite_codes', 'code', 20, true)
  await str('invite_codes', 'institute_id', 255, true)
  await str('invite_codes', 'role', 20, true)           // teacher|student|parent
  await integer('invite_codes', 'max_uses', true, 50)
  await integer('invite_codes', 'used_count', true, 0)
  await str('invite_codes', 'expires_at', 30, true)
  await bool('invite_codes', 'is_active', true, true)
  await idx('invite_codes', 'idx_code', IndexType.Unique, ['code'])
  await idx('invite_codes', 'idx_institute', IndexType.Key, ['institute_id'])
  console.log('  ✓ invite_codes attributes done')

  // ── 17. whatsapp_logs ──────────────────────────────────────────
  await createCollection('whatsapp_logs', 'WhatsApp Logs')
  await str('whatsapp_logs', 'institute_id', 255, true)
  await str('whatsapp_logs', 'recipient_phone', 50, true)
  await str('whatsapp_logs', 'recipient_type', 20, true) // student|parent
  await str('whatsapp_logs', 'message_type', 20, true)   // marks|attendance
  await str('whatsapp_logs', 'template_name', 255)
  await str('whatsapp_logs', 'template_params', 5000)    // JSON string
  await str('whatsapp_logs', 'meta_message_id', 255)
  await str('whatsapp_logs', 'status', 20, true)         // sent|delivered|read|failed
  await str('whatsapp_logs', 'error_message', 1000)
  await str('whatsapp_logs', 'related_id', 255)
  await idx('whatsapp_logs', 'idx_institute', IndexType.Key, ['institute_id'])
  await idx('whatsapp_logs', 'idx_recipient', IndexType.Key, ['recipient_phone'])
  await idx('whatsapp_logs', 'idx_status', IndexType.Key, ['status'])
  console.log('  ✓ whatsapp_logs attributes done')

  // ── 18. notifications (in-app) ─────────────────────────────────
  await createCollection('notifications', 'Notifications')
  await str('notifications', 'user_id', 255, true)
  await str('notifications', 'institute_id', 255, true)
  await str('notifications', 'title', 255, true)
  await str('notifications', 'message', 5000, true)
  await str('notifications', 'type', 20, true)           // marks|attendance|general
  await bool('notifications', 'is_read', true, false)
  await str('notifications', 'related_id', 255)
  await idx('notifications', 'idx_user_read', IndexType.Key, ['user_id', 'is_read'])
  await idx('notifications', 'idx_user', IndexType.Key, ['user_id'])
  console.log('  ✓ notifications attributes done')

  console.log('\n✅ All 18 collections created successfully!')
}

setupDatabase().catch(e => {
  console.error('Setup failed:', e)
  process.exit(1)
})
