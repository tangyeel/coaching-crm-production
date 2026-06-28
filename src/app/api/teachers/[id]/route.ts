export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

async function findTeacher(id: string, instituteId: string) {
  const { data, error } = await db.from('users_profile')
    .select('*')
    .eq('id', id)
    .eq('institute_id', instituteId)
    .eq('role', 'TEACHER')
    .single()
  if (error || !data) throw new HttpError(404, 'Teacher not found')
  return data
}

export const GET = handle(async (_req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  return json(await findTeacher(params.id, instituteOf(session)))
})

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  await findTeacher(params.id, instituteOf(session))
  const data = await parse(req, patchSchema)
  const update: Record<string, unknown> = {}
  if (data.name) update.name = data.name
  if (data.phone !== undefined) update.phone = data.phone
  if (data.subject !== undefined) update.subject = data.subject
  if (data.isActive !== undefined) update.is_active = data.isActive
  const { data: updated, error } = await db.from('users_profile').update(update).eq('id', params.id).select().single()
  if (error) throw new HttpError(500, error.message)
  return json(updated)
})

export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  await findTeacher(params.id, instituteOf(session))
  const { error } = await db.from('users_profile').update({ is_active: false }).eq('id', params.id)
  if (error) throw new HttpError(500, error.message)
  return json({ ok: true })
})
