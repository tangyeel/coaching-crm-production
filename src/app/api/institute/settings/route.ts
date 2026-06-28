export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, HttpError, parse } from '@/lib/api'
import { encrypt, decrypt } from '@/lib/encryption'

const settingsSchema = z.object({
  whatsappToken: z.string().optional().nullable(),
  whatsappPhoneId: z.string().optional().nullable(),
  webhookUrl: z.string().optional().nullable(),
})

export const GET = handle(async () => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  
  const { data: inst, error } = await db
    .from('institutes')
    .select('whatsapp_token, whatsapp_phone_id, join_code, webhook_url')
    .eq('id', instituteId)
    .single()
  
  if (error || !inst) throw new HttpError(404, 'Institute not found')
  return json({
    whatsappToken: decrypt(inst.whatsapp_token),
    whatsappPhoneId: inst.whatsapp_phone_id,
    joinCode: inst.join_code,
    webhookUrl: inst.webhook_url
  })
})

export const PATCH = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const data = await parse(req, settingsSchema)

  const { error } = await db
    .from('institutes')
    .update({
      whatsapp_token: encrypt(data.whatsappToken) ?? null,
      whatsapp_phone_id: data.whatsappPhoneId ?? null,
      webhook_url: data.webhookUrl ?? null,
    })
    .eq('id', instituteId)
  
  if (error) throw new HttpError(500, error.message)
  return json({ message: 'Settings updated successfully' })
})
