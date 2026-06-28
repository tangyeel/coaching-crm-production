import { db } from './db'

export async function triggerWebhook(instituteId: string, eventType: string, data: any) {
  try {
    const { data: inst, error } = await db
      .from('institutes')
      .select('webhook_url')
      .eq('id', instituteId)
      .single()

    if (error || !inst || !inst.webhook_url) {
      return
    }

    const webhookUrl = (inst.webhook_url as string || '').trim()
    if (!webhookUrl) return

    // Perform the fire-and-forget webhook POST
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoachFlow-Webhook-Dispatcher/1.0',
        'X-CoachFlow-Event': eventType
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error(`[WEBHOOK ERROR] ${eventType} responded with ${res.status}: ${await res.text().catch(() => '')}`)
        } else {
          console.log(`[WEBHOOK SENT] ${eventType} to ${webhookUrl}`)
        }
      })
      .catch((err) => {
        console.error(`[WEBHOOK CONNECTION ERROR] failed to POST ${eventType} to ${webhookUrl}:`, err.message)
      })
  } catch (err: any) {
    console.error(`[WEBHOOK TRIGGER ERROR] failed for ${eventType}:`, err.message)
  }
}
