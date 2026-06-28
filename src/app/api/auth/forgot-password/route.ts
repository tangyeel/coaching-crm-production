export const dynamic = 'force-dynamic'
import { z } from 'zod'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { handle, json, parse } from '@/lib/api'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email'

const schema = z.object({ email: z.string().email() })

export const POST = handle(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  await checkRateLimit(`forgot-password:${ip}`, 3, 60 * 60 * 1000)

  const { email } = await parse(req, schema)

  const { data: profile } = await db.from('users_profile')
    .select('id, institute_id')
    .eq('email', email.toLowerCase().trim())
    .single()
  // Always return ok to prevent email enumeration
  if (!profile) return json({ ok: true })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await db.from('password_reset_tokens').insert({ user_id: profile.id, token, expires_at: expiresAt })

  const origin = req.nextUrl?.origin || 'http://localhost:3000'
  const resetUrl = `${origin}/login?token=${token}`

  await sendEmail({
    to: email.toLowerCase().trim(),
    subject: 'Reset your CoachFlow Password',
    text: `You requested a password reset. Click this link to reset your password: ${resetUrl}`,
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 1 hour.</p>`
  })

  return json({ ok: true })
})
