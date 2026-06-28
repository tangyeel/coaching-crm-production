export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, json, HttpError } from '@/lib/api'
import { decrypt } from '@/lib/encryption'

export const POST = handle(async () => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = session.instituteId!

  const { data: inst, error: instErr } = await db
    .from('institutes')
    .select('whatsapp_token, whatsapp_phone_id')
    .eq('id', instituteId)
    .single()

  if (instErr || !inst) throw new HttpError(404, 'Institute not found')
  const decryptedToken = decrypt(inst.whatsapp_token)
  const isMock = !decryptedToken || !inst.whatsapp_phone_id || String(decryptedToken || '').startsWith('mock')

  const { data: pending, error: pendErr } = await db
    .from('notification_queue')
    .select('*')
    .eq('institute_id', instituteId)
    .eq('status', 'PENDING')
    .limit(50)

  if (pendErr) throw new HttpError(500, pendErr.message)
  if (!pending || pending.length === 0) return json({ message: 'No pending alerts.' })

  let successCount = 0
  let failCount = 0
  for (const notif of pending) {
    try {
      const payload = JSON.parse(notif.payload as string)
      let templateName = ''
      let finalParams: any[] = []
      if (notif.type === 'ABSENT') {
        templateName = 'attendance'
        finalParams = [
          { type: 'text', parameter_name: 'student_name', text: payload.studentName },
          { type: 'text', parameter_name: 'status', text: 'Absent' },
          { type: 'text', parameter_name: 'date', text: payload.date },
        ]
      } else if (notif.type === 'MARKS') {
        templateName = 'marks_update'
        const scoreStr = String(payload.score).toUpperCase()
        finalParams = [
          { type: 'text', parameter_name: 'student_name', text: payload.studentName },
          { type: 'text', parameter_name: 'marks', text: scoreStr === 'AB' ? 'AB' : `${scoreStr}/${payload.maxMarks}` },
          { type: 'text', parameter_name: 'test_name', text: payload.examName },
          { type: 'text', parameter_name: 'test_date', text: payload.date || new Date().toLocaleDateString() },
        ]
      } else if (notif.type === 'FEE_REMINDER') {
        templateName = 'fee_reminder'
        finalParams = [
          { type: 'text', parameter_name: 'student_name', text: payload.studentName },
          { type: 'text', parameter_name: 'amount', text: String(payload.amount) },
          { type: 'text', parameter_name: 'due_date', text: payload.dueDate },
        ]
      }

      let success = false
      let apiError: string | null = null

      if (isMock) {
        console.log(`[MOCK WHATSAPP SEND] To: ${notif.recipient}, Template: ${templateName}, Params:`, finalParams)
        success = true
      } else {
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${inst.whatsapp_phone_id}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${decryptedToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: notif.recipient,
            type: 'template',
            template: { name: templateName, language: { code: 'en' }, components: [{ type: 'body', parameters: finalParams }] },
          }),
        })
        
        success = metaRes.ok
        if (!success) {
          try {
            const errData = await metaRes.json()
            apiError = errData.error?.message || `HTTP error ${metaRes.status}`
          } catch {
            apiError = `HTTP error ${metaRes.status}`
          }
        }
      }

      const newStatus = success ? 'SENT' : 'FAILED'
      await db.from('notification_queue').update({ status: newStatus }).eq('id', notif.id as string)
      
      await db.from('whatsapp_logs').insert({
        institute_id: instituteId,
        recipient: notif.recipient,
        status: newStatus,
        message_type: notif.type,
        error_message: success ? null : (apiError || 'Failed to send message via Meta API')
      })

      if (success) successCount++; else failCount++
    } catch (e: any) {
      await db.from('notification_queue').update({ status: 'FAILED' }).eq('id', notif.id as string)
      await db.from('whatsapp_logs').insert({
        institute_id: instituteId,
        recipient: notif.recipient,
        status: 'FAILED',
        message_type: notif.type,
        error_message: e.message || 'Unknown catch error'
      })
      failCount++
    }
  }
  return json({ message: `Sent ${successCount} alerts. Failed: ${failCount}.` + (isMock ? ' (SIMULATED MODE)' : '') })
})
