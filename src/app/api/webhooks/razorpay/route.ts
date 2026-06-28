import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { triggerWebhook } from '@/lib/webhooks'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (secret && signature) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      if (expected !== signature) {
        console.error('[RAZORPAY WEBHOOK] Invalid signature.')
        return new NextResponse('Invalid signature', { status: 400 })
      }
    }

    const event = JSON.parse(rawBody)
    console.log('[RAZORPAY WEBHOOK] Received event:', event.event)

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const invoiceId = payment.notes?.invoiceId || payment.notes?.invoice_id
      const amountPaid = Number(payment.amount) / 100 // Razorpay amounts are in paise

      if (!invoiceId) {
        console.error('[RAZORPAY WEBHOOK] No invoiceId in payment notes.')
        return new NextResponse('Missing invoiceId notes', { status: 400 })
      }

      // Fetch the invoice
      const { data: invoice, error: invErr } = await db
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (invErr || !invoice) {
        console.error(`[RAZORPAY WEBHOOK] Invoice not found: ${invoiceId}`)
        return new NextResponse('Invoice not found', { status: 404 })
      }

      const inv = invoice as any

      if (inv.status === 'PAID') {
        console.log(`[RAZORPAY WEBHOOK] Invoice ${invoiceId} is already paid.`)
        return new NextResponse('Invoice already paid', { status: 200 })
      }

      // Update invoice status
      const { error: updErr } = await db
        .from('invoices')
        .update({ status: 'PAID' })
        .eq('id', invoiceId)

      if (updErr) {
        console.error('[RAZORPAY WEBHOOK] Failed to update invoice:', updErr.message)
        return new NextResponse('DB error updating invoice', { status: 500 })
      }

      // Record fee payment in database
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      await db.from('fee_payments').insert({
        student_id: inv.student_id,
        institute_id: inv.institute_id,
        amount: amountPaid,
        status: 'SUCCESS',
        period_month: currentMonth,
        payment_method: 'RAZORPAY',
        transaction_id: payment.id
      })

      // Update student's fee status
      await db.from('users_profile')
        .update({ fee_status: 'PAID' })
        .eq('id', inv.student_id as string)

      console.log(`[RAZORPAY WEBHOOK SUCCESS] Invoice ${invoiceId} marked as paid. Recorded fee payment.`)

      // Trigger Outgoing Webhook Event
      triggerWebhook(inv.institute_id as string, 'payment.captured', {
        invoiceId,
        studentId: inv.student_id,
        amount: amountPaid,
        transactionId: payment.id,
        paymentMethod: 'RAZORPAY'
      })
    }

    return new NextResponse('OK', { status: 200 })
  } catch (err: any) {
    console.error('[RAZORPAY WEBHOOK ERROR]:', err.message)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
