import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as bcrypt from 'bcryptjs'

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing supabase credentials in env.")
  process.exit(1)
}

const db = createClient(url, serviceKey)

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function run() {
  console.log("Seeding Test Institute 1...")

  const testEmails = [
    'admin@testinstitute1.test',
    'teacher@testinstitute1.test',
    'parent@testinstitute1.test',
    'student@testinstitute1.test'
  ]

  // 1. Clean up existing test accounts & institute
  console.log("Cleaning up existing test data...")
  const { data: existingProfiles } = await db.from('users_profile').select('id, institute_id').in('email', testEmails)
  const instIds = [...new Set((existingProfiles ?? []).map(p => p.institute_id).filter(Boolean))] as string[]

  if (existingProfiles && existingProfiles.length > 0) {
    const profileIds = existingProfiles.map(p => p.id)
    // Delete attendance, marks, batch_students, invoices, payments, logs, etc.
    await db.from('attendance').delete().in('student_id', profileIds)
    await db.from('marks').delete().in('student_id', profileIds)
    await db.from('batch_students').delete().in('student_id', profileIds)
    await db.from('fee_payments').delete().in('student_id', profileIds)
    await db.from('invoices').delete().in('student_id', profileIds)
    await db.from('users_profile').delete().in('id', profileIds)
  }

  for (const instId of instIds) {
    await db.from('batches').delete().eq('institute_id', instId)
    await db.from('payments').delete().eq('institute_id', instId)
    await db.from('institutes').delete().eq('id', instId)
  }

  // Double check delete by name
  const { data: instByName } = await db.from('institutes').select('id').eq('name', 'Test Institute 1')
  for (const inst of (instByName ?? [])) {
    await db.from('batches').delete().eq('institute_id', inst.id)
    await db.from('payments').delete().eq('institute_id', inst.id)
    await db.from('institutes').delete().eq('id', inst.id)
  }

  console.log("Cleanup complete.")

  // 2. Insert Test Institute
  const { data: institute, error: instErr } = await db
    .from('institutes')
    .insert({
      name: 'Test Institute 1',
      email: 'admin@testinstitute1.test',
      phone: '9999999999',
      status: 'ACTIVE',
      plan: 'PRO',
      monthly_fee: 100,
      join_code: 'TESTB1_CODE',
    })
    .select()
    .single()

  if (instErr || !institute) {
    throw new Error(`Failed to create institute: ${instErr?.message}`)
  }
  console.log(`Created Institute: ${institute.name} (ID: ${institute.id})`)

  // 3. Create student profile first
  const studentPwHash = await hashPassword('student123')
  const { data: student, error: studentErr } = await db
    .from('users_profile')
    .insert({
      institute_id: institute.id,
      role: 'STUDENT',
      name: 'Test Student',
      email: 'student@testinstitute1.test',
      password_hash: studentPwHash,
      phone: '+91 99999 77777',
      guardian_name: 'Test Parent',
      guardian_phone: '+91 99999 88888',
      is_active: true,
      requires_password_change: false,
      fee_status: 'DUE'
    })
    .select()
    .single()

  if (studentErr || !student) {
    throw new Error(`Failed to create student profile: ${studentErr?.message}`)
  }
  console.log(`Created Student: ${student.name} (ID: ${student.id})`)

  // 4. Create parent profile linked to student
  const parentPwHash = await hashPassword('parent123')
  const { data: parent, error: parentErr } = await db
    .from('users_profile')
    .insert({
      institute_id: institute.id,
      role: 'PARENT',
      name: 'Test Parent',
      email: 'parent@testinstitute1.test',
      password_hash: parentPwHash,
      phone: '+91 99999 88888',
      student_id: student.id,
      is_active: true,
      requires_password_change: false,
      fee_status: 'PAID'
    })
    .select()
    .single()

  if (parentErr || !parent) {
    throw new Error(`Failed to create parent profile: ${parentErr?.message}`)
  }
  console.log(`Created Parent: ${parent.name} (ID: ${parent.id})`)

  // 5. Create teacher profile
  const teacherPwHash = await hashPassword('teacher123')
  const { data: teacher, error: teacherErr } = await db
    .from('users_profile')
    .insert({
      institute_id: institute.id,
      role: 'TEACHER',
      name: 'Test Teacher',
      email: 'teacher@testinstitute1.test',
      password_hash: teacherPwHash,
      phone: '+91 99999 66666',
      subject: 'Chemistry',
      is_active: true,
      requires_password_change: false,
      fee_status: 'PAID'
    })
    .select()
    .single()

  if (teacherErr || !teacher) {
    throw new Error(`Failed to create teacher profile: ${teacherErr?.message}`)
  }
  console.log(`Created Teacher: ${teacher.name} (ID: ${teacher.id})`)

  // 6. Create admin profile
  const adminPwHash = await hashPassword('admin123')
  const { data: admin, error: adminErr } = await db
    .from('users_profile')
    .insert({
      institute_id: institute.id,
      role: 'INSTITUTE_ADMIN',
      name: 'Test Admin',
      email: 'admin@testinstitute1.test',
      password_hash: adminPwHash,
      phone: '+91 99999 55555',
      is_active: true,
      requires_password_change: false,
      fee_status: 'PAID'
    })
    .select()
    .single()

  if (adminErr || !admin) {
    throw new Error(`Failed to create admin profile: ${adminErr?.message}`)
  }
  console.log(`Created Admin: ${admin.name} (ID: ${admin.id})`)

  // 7. Create a batch
  const { data: batch, error: batchErr } = await db
    .from('batches')
    .insert({
      institute_id: institute.id,
      name: 'Chemistry Batch A',
      subject: 'Chemistry',
      schedule: 'Tue/Thu 4–6 PM',
      capacity: 30,
      teacher_id: teacher.id,
      join_code: 'CHEM101',
      is_active: true,
    })
    .select()
    .single()

  if (batchErr || !batch) {
    throw new Error(`Failed to create batch: ${batchErr?.message}`)
  }
  console.log(`Created Batch: ${batch.name} (ID: ${batch.id})`)

  // 8. Enroll student into batch
  const { error: enrollErr } = await db
    .from('batch_students')
    .insert({
      batch_id: batch.id,
      student_id: student.id,
    })

  if (enrollErr) {
    throw new Error(`Failed to enroll student: ${enrollErr.message}`)
  }
  console.log(`Enrolled Student in Batch.`)

  console.log("\nSeeding completed successfully! Login Credentials:")
  console.log(`- Admin:   email: admin@testinstitute1.test,   password: admin123`)
  console.log(`- Teacher: email: teacher@testinstitute1.test, password: teacher123`)
  console.log(`- Student: email: student@testinstitute1.test, password: student123`)
  console.log(`- Parent:  email: parent@testinstitute1.test,  password: parent123`)
}

run().catch(console.error)
