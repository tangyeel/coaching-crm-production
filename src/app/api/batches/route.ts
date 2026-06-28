export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT'])
  const instituteId = instituteOf(session)
  const search = new URL(req.url).searchParams.get('search')?.trim() ?? ''

  const { data: batches, error } = await db.from('batches')
    .select('id, name, subject, schedule, capacity, teacher_id, is_active, created_at, teacher:users_profile!teacher_id(name), students:batch_students(count)')
    .eq('institute_id', instituteId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw new HttpError(500, error.message)

  const result = (batches ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    schedule: b.schedule,
    capacity: b.capacity,
    teacher_id: b.teacher_id,
    is_active: b.is_active,
    created_at: b.created_at,
    teacher: b.teacher ? { user: { name: b.teacher.name } } : null,
    _count: { students: b.students?.[0]?.count ?? 0 },
  }))

  if (search) return json(result.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.subject.toLowerCase().includes(search.toLowerCase())
  ))

  return json(result)
})

const createSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(1),
  schedule: z.string().min(1),
  capacity: z.number().int().positive().default(30),
  teacherId: z.string().optional(),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, createSchema)

  if (input.teacherId) {
    const { data: t } = await db.from('users_profile').select('id')
      .eq('id', input.teacherId).eq('institute_id', instituteId).single()
    if (!t) throw new HttpError(400, 'Invalid teacher')
  }

  let joinCode = ''
  let batch = null
  let attempts = 0
  while (attempts < 5) {
    joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await db.from('batches').insert({
      institute_id: instituteId,
      name: input.name,
      subject: input.subject,
      schedule: input.schedule,
      capacity: input.capacity,
      teacher_id: input.teacherId ?? null,
      join_code: joinCode,
      is_active: true,
    }).select().single()
    
    if (!error) {
      batch = data
      break
    }
    
    if (error.code === '23505') {
      attempts++
      continue
    }
    
    throw new HttpError(500, error.message)
  }

  if (!batch) {
    throw new HttpError(500, 'Failed to generate a unique join code after 5 attempts')
  }

  return json(batch, 201)
})
