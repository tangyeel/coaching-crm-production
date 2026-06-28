export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

export const GET = handle(async () => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'])
  const instituteId = instituteOf(session)

  const { data: announcements, error } = await db
    .from('announcements')
    .select('*')
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new HttpError(500, error.message)

  let docs = announcements ?? []
  if (session.role === 'STUDENT') {
    const { data: bsRes } = await db
      .from('batch_students')
      .select('batch_id')
      .eq('student_id', session.sub)
      .limit(50)
    const myBatchIds = (bsRes ?? []).map(bs => bs.batch_id)
    docs = docs.filter(a => !a.batch_id || myBatchIds.includes(a.batch_id))
  } else if (session.role === 'PARENT') {
    const { data: parent } = await db
      .from('users_profile')
      .select('student_id')
      .eq('id', session.sub)
      .single()
    if (parent && parent.student_id) {
      const { data: bsRes } = await db
        .from('batch_students')
        .select('batch_id')
        .eq('student_id', parent.student_id)
        .limit(50)
      const myBatchIds = (bsRes ?? []).map(bs => bs.batch_id)
      docs = docs.filter(a => !a.batch_id || myBatchIds.includes(a.batch_id))
    } else {
      docs = docs.filter(a => !a.batch_id)
    }
  }

  const batchIds = [...new Set(docs.map(a => a.batch_id).filter(Boolean))] as string[]
  const authorIds = [...new Set(docs.map(a => a.author_id).filter(Boolean))] as string[]

  const [batchRes, authorRes] = await Promise.all([
    batchIds.length > 0 ? db.from('batches').select('id, name').in('id', batchIds).limit(100) : Promise.resolve({ data: [] }),
    authorIds.length > 0 ? db.from('users_profile').select('id, name').in('id', authorIds).limit(100) : Promise.resolve({ data: [] }),
  ])

  return json(docs.map(a => ({
    ...a,
    id: a.id,
    batch: (batchRes.data ?? []).find(b => b.id === a.batch_id) ? { name: (batchRes.data ?? []).find(b => b.id === a.batch_id)!.name } : null,
    author: (authorRes.data ?? []).find(u => u.id === a.author_id) ? { name: (authorRes.data ?? []).find(u => u.id === a.author_id)!.name } : null,
  })))
})

const createSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  batchId: z.string().nullable().optional(),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, createSchema)

  if (input.batchId) {
    const { data: b } = await db
      .from('batches')
      .select('id')
      .eq('id', input.batchId)
      .eq('institute_id', instituteId)
      .maybeSingle()
    if (!b) throw new HttpError(400, 'Invalid batch')
  }

  const { data: doc, error } = await db.from('announcements').insert({
    institute_id: instituteId,
    batch_id: input.batchId ?? null,
    title: input.title,
    body: input.body,
    author_id: session.sub,
  }).select().single()

  if (error) throw new HttpError(500, error.message)

  return json(doc, 201)
})
