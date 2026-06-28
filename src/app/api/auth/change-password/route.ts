export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, json, parse, HttpError, hashPassword } from '@/lib/api'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

export const POST = handle(async (req) => {
  const session = await auth()
  const { currentPassword, newPassword } = await parse(req, schema)

  const { data: profile } = await db.from('users_profile')
    .select('password_hash')
    .eq('id', session.sub)
    .single()
  if (!profile) throw new HttpError(404, 'User not found')

  const bcrypt = await import('bcryptjs')
  const ok = await bcrypt.compare(currentPassword, profile.password_hash as string)
  if (!ok) throw new HttpError(400, 'Current password is incorrect')

  const hash = await hashPassword(newPassword)
  const { error } = await db.from('users_profile')
    .update({ password_hash: hash, requires_password_change: false })
    .eq('id', session.sub)
  if (error) throw new HttpError(500, 'Failed to update password')

  return json({ ok: true })
})
