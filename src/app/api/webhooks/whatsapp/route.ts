import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET handler for Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? 'coachflow_meta_verification'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WHATSAPP WEBHOOK] Verified successfully.')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('[WHATSAPP WEBHOOK] Verification failed.')
  return new NextResponse('Forbidden', { status: 403 })
}

// POST handler for Meta status updates and incoming messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[WHATSAPP WEBHOOK] Received event payload:', JSON.stringify(body))

    // Meta WhatsApp webhook structure
    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    if (value) {
      // 1. Check for Status Updates (sent, delivered, read, failed)
      const statusUpdate = value.statuses?.[0]
      if (statusUpdate) {
        const recipientPhone = statusUpdate.recipient_id
        const status = statusUpdate.status.toUpperCase() // SENT, DELIVERED, READ, FAILED
        const errors = statusUpdate.errors?.[0]
        const errorMessage = errors ? `${errors.title}: ${errors.message}` : null

        // Try to find matching notification record to resolve instituteId
        // In a production app, we would map the message ID to the sender institute.
        // We'll log it with a generic query or find the last sent message.
        const { data: latestNotification } = await db
          .from('notification_queue')
          .select('institute_id')
          .eq('recipient', recipientPhone)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const instituteId = latestNotification?.institute_id ?? null

        // Insert into whatsapp_logs
        await db.from('whatsapp_logs').insert({
          institute_id: instituteId,
          recipient: recipientPhone,
          status: status,
          message_type: 'STATUS_UPDATE',
          error_message: errorMessage
        })

        console.log(`[WHATSAPP WEBHOOK STATUS] Logged status "${status}" for ${recipientPhone}`)
      }

      // 2. Check for Incoming Messages (User replies)
      const incomingMessage = value.messages?.[0]
      if (incomingMessage) {
        const senderPhone = incomingMessage.from
        const textBody = incomingMessage.text?.body || '[Non-text message]'

        const { data: latestNotification } = await db
          .from('notification_queue')
          .select('institute_id')
          .eq('recipient', senderPhone)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const instituteId = latestNotification?.institute_id ?? null

        await db.from('whatsapp_logs').insert({
          institute_id: instituteId,
          recipient: senderPhone,
          status: 'RECEIVED',
          message_type: incomingMessage.type,
          error_message: textBody // Store reply text in error_message or a metadata field
        })

        console.log(`[WHATSAPP WEBHOOK REPLY] Received message from ${senderPhone}: ${textBody}`)
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (err: any) {
    console.error('[WHATSAPP WEBHOOK ERROR]:', err.message)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
