export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

const updateSchema = z.object({
  is_active: z.boolean().optional(),
  max_uses: z.number().int().positive().optional(),
  expires_at: z.string().optional(),
})

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, updateSchema)

  const { data: doc, error: fetchErr } = await db
    .from('invite_codes')
    .select('institute_id')
    .eq('id', params.id)
    .maybeSingle()

  if (fetchErr || !doc) {
    throw new HttpError(404, 'Invite code not found')
  }

  if (doc.institute_id !== instituteId) {
    throw new HttpError(404, 'Invite code not found')
  }

  const updates: Record<string, any> = {}
  if (input.is_active !== undefined) updates.is_active = input.is_active
  if (input.max_uses !== undefined) updates.max_uses = input.max_uses
  if (input.expires_at !== undefined) updates.expires_at = input.expires_at

  const { data: updated, error: updateErr } = await db
    .from('invite_codes')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (updateErr) throw new HttpError(500, updateErr.message)

  return json({ id: updated.id, ...updates })
})
