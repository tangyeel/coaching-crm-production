export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('perPage') ?? 10) || 10))

  const { data: items, count, error } = await db.from('fee_payments')
    .select('*', { count: 'exact' })
    .eq('institute_id', instituteId)
    .order('paid_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)
  if (error) throw new HttpError(500, error.message)

  const studentIds = [...new Set((items ?? []).map(p => p.student_id))]
  const { data: profiles } = studentIds.length
    ? await db.from('users_profile').select('id, name').in('id', studentIds)
    : { data: [] }

  const { data: all } = await db.from('fee_payments').select('amount').eq('institute_id', instituteId)
  const collected = (all ?? []).reduce((s, p) => s + Number(p.amount), 0)

  const result = (items ?? []).map(p => ({
    ...p,
    student: { user: { name: (profiles ?? []).find(pr => pr.id === p.student_id)?.name ?? '' } },
  }))

  return json({ items: result, total: count ?? 0, page, perPage, collected })
})

const postSchema = z.object({
  studentId: z.string(),
  amount: z.number().positive(),
  note: z.string().optional(),
  markPaid: z.boolean().default(true),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, postSchema)

  const { data: student } = await db.from('users_profile').select('id')
    .eq('id', input.studentId).eq('institute_id', instituteId).single()
  if (!student) throw new HttpError(404, 'Student not found')

  const { data: payment, error } = await db.from('fee_payments').insert({
    student_id: input.studentId,
    institute_id: instituteId,
    amount: input.amount,
    method: 'CASH',
    note: input.note ?? null,
    recorded_by_id: session.sub,
  }).select().single()
  if (error) throw new HttpError(500, error.message)

  if (input.markPaid) {
    await db.from('users_profile').update({ fee_status: 'PAID' }).eq('id', input.studentId)
  }

  return json(payment, 201)
})
