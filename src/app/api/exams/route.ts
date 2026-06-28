export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT'])
  const instituteId = instituteOf(session)
  const batchId = new URL(req.url).searchParams.get('batchId')
  if (!batchId) throw new HttpError(400, 'batchId is required')

  const { data: batch } = await db.from('batches').select('id').eq('id', batchId).eq('institute_id', instituteId).single()
  if (!batch) throw new HttpError(404, 'Batch not found')

  const { data: exams, error } = await db.from('exams')
    .select('*')
    .eq('batch_id', batchId)
    .order('date', { ascending: false })
  if (error) throw new HttpError(500, error.message)

  const examIds = (exams ?? []).map(e => e.id)
  const { data: marks } = examIds.length
    ? await db.from('marks').select('exam_id').in('exam_id', examIds)
    : { data: [] }

  return json((exams ?? []).map(e => ({
    ...e,
    _count: { marks: (marks ?? []).filter(m => m.exam_id === e.id).length },
  })))
})

const createSchema = z.object({
  batchId: z.string(),
  name: z.string().min(2),
  maxMarks: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, createSchema)

  const { data: batch } = await db.from('batches').select('id').eq('id', input.batchId).eq('institute_id', instituteId).single()
  if (!batch) throw new HttpError(404, 'Batch not found')

  const { data: exam, error } = await db.from('exams').insert({
    batch_id: input.batchId,
    institute_id: instituteId,
    name: input.name,
    max_marks: input.maxMarks,
    date: input.date,
  }).select().single()
  if (error) throw new HttpError(500, error.message)
  return json(exam, 201)
})
