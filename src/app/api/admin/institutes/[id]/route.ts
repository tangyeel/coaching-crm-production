export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, json, parse, HttpError } from '@/lib/api'
import { encrypt } from '@/lib/encryption'

const patchSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional(),
  monthlyFee: z.number().nonnegative().optional(),
  whatsappToken: z.string().optional().nullable(),
  whatsappPhoneId: z.string().optional().nullable(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  await auth(['SUPER_ADMIN'])
  const data = await parse(req, patchSchema)
  
  const updates: Record<string, any> = {}
  if (data.status !== undefined) updates.status = data.status
  if (data.plan !== undefined) updates.plan = data.plan
  if (data.monthlyFee !== undefined) updates.monthly_fee = data.monthlyFee
  if (data.whatsappToken !== undefined) updates.whatsapp_token = encrypt(data.whatsappToken)
  if (data.whatsappPhoneId !== undefined) updates.whatsapp_phone_id = data.whatsappPhoneId
  if (data.name !== undefined) updates.name = data.name
  if (data.email !== undefined) updates.email = data.email
  if (data.phone !== undefined) updates.phone = data.phone
  if (data.address !== undefined) updates.address = data.address

  const { data: updated, error } = await db
    .from('institutes')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error || !updated) {
    throw new HttpError(404, 'Institute not found')
  }

  return json(updated)
})
