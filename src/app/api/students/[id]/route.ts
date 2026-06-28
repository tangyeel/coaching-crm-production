export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

async function findStudent(id: string, instituteId: string) {
  const { data, error } = await db.from('users_profile')
    .select('*')
    .eq('id', id)
    .eq('institute_id', instituteId)
    .eq('role', 'STUDENT')
    .single()
  if (error || !data) throw new HttpError(404, 'Student not found')
  return data
}

export const GET = handle(async (_req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const student = await findStudent(params.id, instituteOf(session))
  const { data: bs } = await db.from('batch_students').select('batch_id').eq('student_id', params.id)
  const batchIds = (bs ?? []).map(b => b.batch_id)
  const [batchesRes, attendanceRes, marksRes] = await Promise.all([
    batchIds.length ? db.from('batches').select('id, name, subject').in('id', batchIds) : Promise.resolve({ data: [] }),
    db.from('attendance').select('date, status, batch:batches(name)').eq('student_id', params.id).is('deleted_at', null).order('date', { ascending: false }).limit(200),
    db.from('marks').select('score, exam:exams(name, max_marks, date, batch:batches(name))').eq('student_id', params.id).is('deleted_at', null).limit(200)
  ])
  return json({
    ...student,
    enrollments: (batchesRes.data ?? []).map(b => ({ batch: b })),
    attendance: attendanceRes.data ?? [],
    marks: marksRes.data ?? []
  })
})

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  feeStatus: z.enum(['PAID', 'DUE']).optional(),
})

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  await findStudent(params.id, instituteOf(session))
  const data = await parse(req, patchSchema)
  const update: Record<string, unknown> = {}
  if (data.name) update.name = data.name
  if (data.phone !== undefined) update.phone = data.phone
  if (data.guardianName !== undefined) update.guardian_name = data.guardianName
  if (data.guardianPhone !== undefined) update.guardian_phone = data.guardianPhone
  if (data.feeStatus) update.fee_status = data.feeStatus
  const { data: updated, error } = await db.from('users_profile').update(update).eq('id', params.id).select().single()
  if (error) throw new HttpError(500, error.message)
  return json(updated)
})

export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  await findStudent(params.id, instituteOf(session))
  const { error } = await db.from('users_profile').update({ is_active: false }).eq('id', params.id)
  if (error) throw new HttpError(500, error.message)
  return json({ ok: true })
})
