#!/usr/bin/env tsx
/**
 * Seed demo data into Supabase.
 * Run: npx tsx scripts/seed-supabase.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

async function hash(pw: string) {
  return bcrypt.hash(pw, 10)
}

async function main() {
  console.log('Seeding…')

  // ── 1. Super admin ────────────────────────────────────────────────────────
  const { data: sa, error: saErr } = await db.from('users_profile').upsert(
    {
      email: 'admin@platform.test',
      name: 'Super Admin',
      password_hash: await hash('admin123'),
      role: 'SUPER_ADMIN',
      institute_id: null,
      is_active: true,
      requires_password_change: false,
      fee_status: 'DUE',
    },
    { onConflict: 'email' },
  ).select('id').single()
  if (saErr) { console.error('Super admin:', saErr.message); process.exit(1) }
  console.log('✓ Super admin', sa!.id)

  // ── 2. Institute ──────────────────────────────────────────────────────────
  const { data: inst, error: instErr } = await db.from('institutes').upsert(
    {
      name: 'Bright Future Academy',
      email: 'contact@brightfuture.test',
      phone: '9800000000',
      status: 'ACTIVE',
      plan: 'BASIC',
      monthly_fee: 0,
      join_code: 'BFA001',
    },
    { onConflict: 'id' },
  ).select('id').single()
  // upsert by email isn't possible without unique constraint on email — insert or ignore instead
  if (instErr) {
    // Try fetching existing
    const { data: existing } = await db.from('institutes').select('id').eq('name', 'Bright Future Academy').single()
    if (!existing) { console.error('Institute:', instErr.message); process.exit(1) }
    console.log('✓ Institute (existing)', existing.id)
    await seed(existing.id as string)
    return
  }
  console.log('✓ Institute', inst!.id)
  await seed(inst!.id as string)
}

async function seed(instituteId: string) {
  // ── 3. Institute admin ───────────────────────────────────────────────────
  const { data: admin, error: adminErr } = await db.from('users_profile').upsert(
    {
      email: 'admin@brightfuture.test',
      name: 'Bright Future Admin',
      password_hash: await hash('admin123'),
      role: 'INSTITUTE_ADMIN',
      institute_id: instituteId,
      is_active: true,
      requires_password_change: false,
      fee_status: 'DUE',
    },
    { onConflict: 'email' },
  ).select('id').single()
  if (adminErr) { console.error('Institute admin:', adminErr.message); process.exit(1) }
  console.log('✓ Institute admin', admin!.id)

  // ── 4. Teacher ────────────────────────────────────────────────────────────
  const { data: teacher, error: teacherErr } = await db.from('users_profile').upsert(
    {
      email: 'priya@brightfuture.test',
      name: 'Priya Sharma',
      password_hash: await hash('teacher123'),
      role: 'TEACHER',
      institute_id: instituteId,
      subject: 'Mathematics',
      is_active: true,
      requires_password_change: false,
      fee_status: 'DUE',
    },
    { onConflict: 'email' },
  ).select('id').single()
  if (teacherErr) { console.error('Teacher:', teacherErr.message); process.exit(1) }
  console.log('✓ Teacher', teacher!.id)

  // ── 5. Student ────────────────────────────────────────────────────────────
  const { data: student, error: studentErr } = await db.from('users_profile').upsert(
    {
      email: 'aarav@brightfuture.test',
      name: 'Aarav Shah',
      password_hash: await hash('student123'),
      role: 'STUDENT',
      institute_id: instituteId,
      fee_status: 'DUE',
      is_active: true,
      requires_password_change: false,
    },
    { onConflict: 'email' },
  ).select('id').single()
  if (studentErr) { console.error('Student:', studentErr.message); process.exit(1) }
  console.log('✓ Student', student!.id)

  // ── 6. Batch ──────────────────────────────────────────────────────────────
  const { data: batch, error: batchErr } = await db.from('batches').insert({
    institute_id: instituteId,
    name: 'Math Batch A',
    subject: 'Mathematics',
    schedule: 'Mon/Wed/Fri 4–6 PM',
    capacity: 30,
    teacher_id: teacher!.id,
    join_code: 'MATHA1',
    is_active: true,
  }).select('id').single()
  if (batchErr && !batchErr.message.includes('duplicate')) {
    console.error('Batch:', batchErr.message); process.exit(1)
  }
  const batchId = batch?.id ?? (await db.from('batches').select('id').eq('join_code', 'MATHA1').single()).data!.id
  console.log('✓ Batch', batchId)

  // ── 7. Enroll student in batch ────────────────────────────────────────────
  await db.from('batch_students').upsert(
    { batch_id: batchId, student_id: student!.id },
    { onConflict: 'batch_id,student_id' },
  )
  console.log('✓ Enrolled student in batch')

  console.log('\nDone! Demo credentials:')
  console.log('  Super admin : admin@platform.test / admin123')
  console.log('  Admin       : admin@brightfuture.test / admin123')
  console.log('  Teacher     : priya@brightfuture.test / teacher123')
  console.log('  Student     : aarav@brightfuture.test / student123')
}

main().catch(e => { console.error(e); process.exit(1) })
