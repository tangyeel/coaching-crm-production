export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError, hashPassword } from '@/lib/api'
import { triggerWebhook } from '@/lib/webhooks'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('perPage') ?? 10) || 10))
  const search = url.searchParams.get('search')?.trim() ?? ''

  let q = db.from('users_profile')
    .select('id, name, email, phone, guardian_name, guardian_phone, fee_status, is_active, created_at, enrollments:batch_students(batch:batches(id, name))', { count: 'exact' })
    .eq('institute_id', instituteId)
    .eq('role', 'STUDENT')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name')
    .range((page - 1) * perPage, page * perPage - 1)

  if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data: items, count, error } = await q
  if (error) throw new HttpError(500, error.message)

  return json({ items: items ?? [], total: count ?? 0, page, perPage })
})

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  feeStatus: z.enum(['PAID', 'DUE']).default('DUE'),
  batchIds: z.array(z.string()).default([]),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, createSchema)

  const { data: existing } = await db.from('users_profile').select('id').eq('email', input.email.toLowerCase()).single()
  if (existing) throw new HttpError(400, 'Email already in use')

  if (input.batchIds.length) {
    const { data: batches } = await db.from('batches').select('id').in('id', input.batchIds).eq('institute_id', instituteId)
    if (!batches || batches.length !== input.batchIds.length) throw new HttpError(403, 'Access denied to one or more batches')
  }

  const { data: profile, error } = await db.from('users_profile').insert({
    name: input.name,
    email: input.email.toLowerCase().trim(),
    password_hash: await hashPassword(input.password),
    role: 'STUDENT',
    institute_id: instituteId,
    phone: input.phone ?? null,
    guardian_name: input.guardianName ?? null,
    guardian_phone: input.guardianPhone ?? null,
    fee_status: input.feeStatus,
    is_active: true,
    requires_password_change: false,
  }).select().single()
  if (error) throw new HttpError(500, error.message)

  if (input.batchIds.length) {
    await db.from('batch_students').insert(
      input.batchIds.map(batchId => ({ batch_id: batchId, student_id: profile!.id }))
    )
  }

  triggerWebhook(instituteId, 'student.created', {
    id: profile!.id,
    name: profile!.name,
    email: profile!.email,
    phone: profile!.phone,
    guardianName: profile!.guardian_name,
    guardianPhone: profile!.guardian_phone,
    feeStatus: profile!.fee_status
  })

  return json(profile, 201)
})
