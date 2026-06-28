export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

async function findBatch(id: string, instituteId: string) {
  const { data, error } = await db.from('batches').select('*').eq('id', id).eq('institute_id', instituteId).single()
  if (error || !data) throw new HttpError(404, 'Batch not found')
  return data
}

export const GET = handle(async (_req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT'])
  return json(await findBatch(params.id, instituteOf(session)))
})

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  subject: z.string().optional(),
  schedule: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  teacherId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  await findBatch(params.id, instituteOf(session))
  const data = await parse(req, patchSchema)
  const update: Record<string, unknown> = {}
  if (data.name) update.name = data.name
  if (data.subject !== undefined) update.subject = data.subject
  if (data.schedule !== undefined) update.schedule = data.schedule
  if (data.capacity !== undefined) update.capacity = data.capacity
  if (data.teacherId !== undefined) update.teacher_id = data.teacherId
  if (data.isActive !== undefined) update.is_active = data.isActive
  const { data: updated, error } = await db.from('batches').update(update).eq('id', params.id).select().single()
  if (error) throw new HttpError(500, error.message)
  return json(updated)
})

export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  await findBatch(params.id, instituteOf(session))
  await db.from('batch_students').delete().eq('batch_id', params.id)
  const { error } = await db.from('batches').delete().eq('id', params.id)
  if (error) throw new HttpError(500, error.message)
  return json({ ok: true })
})
