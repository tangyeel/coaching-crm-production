export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError, logAction } from '@/lib/api'

const paySchema = z.object({ method: z.enum(['CASH', 'ONLINE']), note: z.string().optional() })

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'])
  const instituteId = instituteOf(session)
  const input = await parse(req, paySchema)

  if (['PARENT', 'STUDENT'].includes(session.role) && input.method !== 'ONLINE') {
    throw new HttpError(403, 'Students and parents can only make online payments')
  }

  const { data: invoice, error } = await db
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !invoice) throw new HttpError(404, 'Invoice not found')
  const inv = invoice as any
  if (inv.institute_id !== instituteId) throw new HttpError(404, 'Invoice not found')
  if (inv.status === 'PAID') throw new HttpError(400, 'Invoice already paid')

  const { data: payment, error: payErr } = await db
    .from('fee_payments')
    .insert({
      institute_id: instituteId,
      student_id: inv.student_id,
      amount: inv.total_amount,
      method: input.method,
      invoice_id: inv.id,
      note: input.note ?? null,
      recorded_by_id: session.sub,
    })
    .select()
    .single()

  if (payErr || !payment) throw new HttpError(500, payErr?.message || 'Failed to record payment')

  await db.from('invoices').update({ status: 'PAID' }).eq('id', inv.id)
  await db.from('users_profile').update({ fee_status: 'PAID' }).eq('id', inv.student_id)
  await logAction(instituteId, session.sub, 'PAY_INVOICE_CASH', 'Invoice', inv.id)

  return json(payment, 201)
})
