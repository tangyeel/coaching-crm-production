export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError, hashPassword } from '@/lib/api'

export const GET = handle(async () => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT'])
  const instituteId = instituteOf(session)
  const { data: teachers, error } = await db.from('users_profile')
    .select('id, name, email, phone, subject')
    .eq('institute_id', instituteId)
    .eq('role', 'TEACHER')
    .eq('is_active', true)
    .order('name')
  if (error) throw new HttpError(500, error.message)
  const { data: batches } = await db.from('batches').select('id, teacher_id').eq('institute_id', instituteId)
  return json((teachers ?? []).map(t => ({
    ...t,
    _count: { batches: (batches ?? []).filter(b => b.teacher_id === t.id).length },
  })))
})

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  subject: z.string().optional(),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, createSchema)

  const { data: existing } = await db.from('users_profile').select('id').eq('email', input.email.toLowerCase()).single()
  if (existing) throw new HttpError(400, 'Email already in use')

  const { data: profile, error } = await db.from('users_profile').insert({
    name: input.name,
    email: input.email.toLowerCase().trim(),
    password_hash: await hashPassword(input.password),
    role: 'TEACHER',
    institute_id: instituteId,
    phone: input.phone ?? null,
    subject: input.subject ?? null,
    is_active: true,
    requires_password_change: false,
    fee_status: 'DUE',
  }).select().single()
  if (error) throw new HttpError(500, error.message)
  return json(profile, 201)
})
