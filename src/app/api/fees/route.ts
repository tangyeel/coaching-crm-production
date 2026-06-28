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

  // Fetch student's unpaid invoices
  const { data: openInvoices } = await db
    .from('invoices')
    .select('*')
    .eq('student_id', input.studentId)
    .eq('status', 'ISSUED')
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  let remainingAmount = input.amount
  const paymentsToInsert = []

  if (openInvoices && openInvoices.length > 0) {
    const openInvoiceIds = openInvoices.map(i => i.id)
    const { data: existingPayments } = await db
      .from('fee_payments')
      .select('invoice_id, amount')
      .in('invoice_id', openInvoiceIds)
      .is('deleted_at', null)

    const paidSum: Record<string, number> = {}
    for (const ep of (existingPayments ?? [])) {
      if (ep.invoice_id) {
        paidSum[ep.invoice_id] = (paidSum[ep.invoice_id] ?? 0) + Number(ep.amount)
      }
    }

    for (const inv of openInvoices) {
      if (remainingAmount <= 0) break

      const total = Number(inv.total_amount)
      const alreadyPaid = paidSum[inv.id] || 0
      const due = Math.max(0, total - alreadyPaid)

      if (due <= 0) continue

      const applyAmount = Math.min(remainingAmount, due)
      remainingAmount -= applyAmount

      paymentsToInsert.push({
        student_id: input.studentId,
        institute_id: instituteId,
        amount: applyAmount,
        method: 'CASH',
        note: input.note ?? null,
        recorded_by_id: session.sub,
        invoice_id: inv.id,
      })

      if (alreadyPaid + applyAmount >= total) {
        await db.from('invoices').update({ status: 'PAID' }).eq('id', inv.id)
      }
    }
  }

  // If there's still leftover amount or if no invoices were open, save as general payment
  if (remainingAmount > 0 || paymentsToInsert.length === 0) {
    paymentsToInsert.push({
      student_id: input.studentId,
      institute_id: instituteId,
      amount: remainingAmount,
      method: 'CASH',
      note: input.note ?? null,
      recorded_by_id: session.sub,
      invoice_id: null,
    })
  }

  const { data: inserted, error: payErr } = await db
    .from('fee_payments')
    .insert(paymentsToInsert)
    .select()

  if (payErr || !inserted || inserted.length === 0) {
    throw new HttpError(500, payErr?.message || 'Failed to record fee payments')
  }

  if (input.markPaid) {
    await db.from('users_profile').update({ fee_status: 'PAID' }).eq('id', input.studentId)
  }

  return json(inserted[0], 201)
})
