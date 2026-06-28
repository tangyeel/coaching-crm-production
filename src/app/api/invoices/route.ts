export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError, logAction } from '@/lib/api'
import { triggerWebhook } from '@/lib/webhooks'

export const GET = handle(async () => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'])
  const instituteId = instituteOf(session)
  
  let q = db.from('invoices').select('*').eq('institute_id', instituteId).order('created_at', { ascending: false }).limit(500)

  if (session.role === 'STUDENT') {
    q = q.eq('student_id', session.sub)
  } else if (session.role === 'PARENT') {
    const { data: parent } = await db
      .from('users_profile')
      .select('student_id')
      .eq('id', session.sub)
      .single()
    
    if (!parent || !parent.student_id) return json([])
    q = q.eq('student_id', parent.student_id)
  }

  const { data: invoices, error } = await q
  if (error) throw new HttpError(500, error.message)

  const invoiceIds = (invoices ?? []).map(i => i.id)
  const { data: payments } = invoiceIds.length > 0
    ? await db.from('fee_payments').select('invoice_id, amount').in('invoice_id', invoiceIds).is('deleted_at', null)
    : { data: [] }

  const paidAmounts: Record<string, number> = {}
  for (const p of (payments ?? [])) {
    if (p.invoice_id) {
      paidAmounts[p.invoice_id] = (paidAmounts[p.invoice_id] ?? 0) + Number(p.amount)
    }
  }

  const studentIds = [...new Set((invoices ?? []).map(i => i.student_id))] as string[]
  const { data: profiles } = studentIds.length > 0
    ? await db.from('users_profile').select('id, name').in('id', studentIds).limit(200)
    : { data: [] }

  const updatedInvoices = []
  for (const inv of (invoices ?? [])) {
    const amountPaid = paidAmounts[inv.id] || 0
    const amountDue = Math.max(0, Number(inv.total_amount) - amountPaid)
    let currentStatus = inv.status

    if (amountDue === 0 && currentStatus !== 'PAID') {
      await db.from('invoices').update({ status: 'PAID' }).eq('id', inv.id)
      currentStatus = 'PAID'
    }

    updatedInvoices.push({
      ...inv,
      status: currentStatus,
      amount_paid: amountPaid,
      amount_due: amountDue,
      items: JSON.parse((inv.items_json as string) || '[]'),
      student: { user: { name: (profiles ?? []).find(p => p.id === inv.student_id)?.name ?? '' } },
    })
  }

  return json(updatedInvoices)
})

const createSchema = z.object({
  studentId: z.string(),
  dueDate: z.string(),
  items: z.array(z.object({ description: z.string(), amount: z.number().positive() })).min(1),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, createSchema)

  const { data: student } = await db
    .from('users_profile')
    .select('id')
    .eq('id', input.studentId)
    .eq('institute_id', instituteId)
    .maybeSingle()

  if (!student) throw new HttpError(404, 'Student not found')

  const totalAmount = input.items.reduce((s, i) => s + i.amount, 0)

  const { data: invoice, error } = await db
    .from('invoices')
    .insert({
      institute_id: instituteId,
      student_id: input.studentId,
      status: 'ISSUED',
      due_date: input.dueDate,
      total_amount: totalAmount,
      items_json: JSON.stringify(input.items),
    })
    .select()
    .single()

  if (error || !invoice) throw new HttpError(500, error?.message || 'Failed to create invoice')

  await logAction(instituteId, session.sub, 'CREATE_INVOICE', 'Invoice', invoice.id as string, `Amount: ${totalAmount}`)
  await db.from('users_profile').update({ fee_status: 'DUE' }).eq('id', input.studentId)

  triggerWebhook(instituteId, 'invoice.created', {
    id: invoice.id,
    studentId: invoice.student_id,
    status: invoice.status,
    dueDate: invoice.due_date,
    totalAmount: invoice.total_amount,
    items: input.items
  })

  return json({ ...invoice, items: input.items }, 201)
})
