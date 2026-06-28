export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { handle, json, parse, HttpError, hashPassword } from '@/lib/api'
import { checkRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email().optional(),
  token: z.string().optional(),
  newPassword: z.string().min(6),
})

export const POST = handle(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  await checkRateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000)

  const { email, token, newPassword } = await parse(req, schema)
  const hash = await hashPassword(newPassword)

  if (token) {
    const { data: t } = await db.from('password_reset_tokens')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .single()
    if (!t || new Date(t.expires_at as string) < new Date()) throw new HttpError(400, 'Invalid or expired token')

    const { error } = await db.from('users_profile')
      .update({ password_hash: hash, requires_password_change: false })
      .eq('id', t.user_id as string)
    if (error) throw new HttpError(500, 'Failed to update password')

    await db.from('password_reset_tokens').delete().eq('user_id', t.user_id as string)
    return json({ ok: true })
  }

  if (!email) throw new HttpError(400, 'Email or token is required')
  const session = await getSession()
  if (!session || !['SUPER_ADMIN', 'INSTITUTE_ADMIN', 'TEACHER'].includes(session.role)) throw new HttpError(403, 'Forbidden')

  const { data: target } = await db.from('users_profile')
    .select('id, institute_id')
    .eq('email', email.toLowerCase().trim())
    .single()
  if (!target) throw new HttpError(404, 'User not found')

  if (['INSTITUTE_ADMIN', 'TEACHER'].includes(session.role) && target.institute_id !== session.instituteId) {
    throw new HttpError(403, 'You can only reset passwords for users in your institute')
  }

  const { error } = await db.from('users_profile')
    .update({ password_hash: hash, requires_password_change: false })
    .eq('id', target.id as string)
  if (error) throw new HttpError(500, 'Failed to update password')

  return json({ ok: true })
})
