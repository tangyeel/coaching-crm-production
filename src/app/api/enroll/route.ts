export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { handle, json, parse, HttpError, hashPassword } from '@/lib/api'

const schema = z.object({
  joinCode: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  guardianRelation: z.enum(['Father', 'Mother', 'Guardian']).default('Father'),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
})

export const POST = handle(async (req) => {
  const input = await parse(req, schema)

  let institute: any = null
  let batch: any = null

  const { data: instByCode } = await db
    .from('institutes')
    .select('*')
    .eq('join_code', input.joinCode.toUpperCase())
    .maybeSingle()

  if (instByCode) {
    institute = instByCode
  } else {
    const { data: batchByCode } = await db
      .from('batches')
      .select('*')
      .eq('join_code', input.joinCode.toUpperCase())
      .maybeSingle()

    if (batchByCode) {
      batch = batchByCode
      const { data: inst } = await db
        .from('institutes')
        .select('*')
        .eq('id', batch.institute_id)
        .single()
      institute = inst
    }
  }

  if (!institute) throw new HttpError(404, 'Invalid code. Please check your Institute or Batch code.')
  if (institute.status !== 'ACTIVE') throw new HttpError(403, 'This institute is currently inactive.')

  if (batch) {
    const { count } = await db
      .from('batch_students')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', batch.id)
    if ((count ?? 0) >= batch.capacity) throw new HttpError(400, 'This batch is already at full capacity.')
  }

  const { data: exists } = await db
    .from('users_profile')
    .select('id')
    .eq('email', input.email.toLowerCase().trim())
    .maybeSingle()
  if (exists) throw new HttpError(400, 'Email already registered. Please login instead.')

  const guardianLabel = input.guardianName
    ? `${input.guardianRelation}: ${input.guardianName}`
    : null

  const pwHash = await hashPassword(input.password)

  const { data: profile, error: profErr } = await db
    .from('users_profile')
    .insert({
      institute_id: institute.id,
      role: 'STUDENT',
      name: input.name,
      email: input.email.toLowerCase().trim(),
      password_hash: pwHash,
      phone: input.phone ?? null,
      guardian_name: guardianLabel,
      guardian_phone: input.guardianPhone ?? null,
      fee_status: 'DUE',
      requires_password_change: false,
      is_active: true,
    })
    .select('id')
    .single()

  if (profErr || !profile) throw new HttpError(500, 'Failed to create student profile')

  if (batch) {
    const { error: enrollErr } = await db.from('batch_students').insert({
      batch_id: batch.id,
      student_id: profile.id,
    })
    if (enrollErr) throw new HttpError(500, 'Failed to enroll student in batch')
  }

  const targetName = batch ? `Batch "${batch.name}"` : `${institute.name}`
  return json({ message: `Successfully enrolled in ${targetName}!` }, 201)
})
