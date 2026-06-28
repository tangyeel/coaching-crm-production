export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

const schema = z.object({
  studentId: z.string(),
  batchId: z.string(),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const { studentId, batchId } = await parse(req, schema)

  const { data: batch, error: batchErr } = await db
    .from('batches')
    .select('id, capacity')
    .eq('id', batchId)
    .eq('institute_id', instituteId)
    .maybeSingle()
  if (batchErr || !batch) throw new HttpError(404, 'Batch not found')

  const { data: student, error: studentErr } = await db
    .from('users_profile')
    .select('id')
    .eq('id', studentId)
    .eq('institute_id', instituteId)
    .maybeSingle()
  if (studentErr || !student) throw new HttpError(404, 'Student not found')

  const { data: alreadyIn } = await db
    .from('batch_students')
    .select('id')
    .eq('batch_id', batchId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (alreadyIn) throw new HttpError(400, 'Student already in this batch')

  const { count: enrolledCount } = await db
    .from('batch_students')
    .select('id', { count: 'exact', head: true })
    .eq('batch_id', batchId)
  
  if ((enrolledCount ?? 0) >= (batch.capacity as number)) throw new HttpError(400, 'Batch is at full capacity')

  const { error: insertErr } = await db.from('batch_students').insert({
    batch_id: batchId,
    student_id: studentId,
  })
  if (insertErr) throw new HttpError(500, insertErr.message)

  return json({ ok: true })
})

export const DELETE = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const url = new URL(req.url)
  const batchId = url.searchParams.get('batchId')
  const studentId = url.searchParams.get('studentId')
  if (!batchId || !studentId) throw new HttpError(400, 'batchId and studentId required')

  const { data: batch } = await db
    .from('batches')
    .select('id')
    .eq('id', batchId)
    .eq('institute_id', instituteId)
    .maybeSingle()
  if (!batch) throw new HttpError(404, 'Batch not found')

  const { data: enrollment } = await db
    .from('batch_students')
    .select('id')
    .eq('batch_id', batchId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (!enrollment) throw new HttpError(404, 'Enrollment not found')

  const { error: deleteErr } = await db
    .from('batch_students')
    .delete()
    .eq('id', enrollment.id as string)
  
  if (deleteErr) throw new HttpError(500, deleteErr.message)

  return json({ ok: true })
})
