export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { verifyCredentials, signSession, getSessionCookieName } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { json } from '@/lib/api'

export const POST = async (req: NextRequest) => {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  try { await checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000) }
  catch { return json({ error: 'Too many attempts' }, 429) }

  const body = await req.json().catch(() => null)
  const { email, password } = body ?? {}
  if (!email || !password) return json({ error: 'Email and password required' }, 400)

  const session = await verifyCredentials(email, password)
  if (!session) return json({ error: 'Invalid email or password' }, 401)

  if (session.role !== 'SUPER_ADMIN' && session.instituteId) {
    const { data: inst } = await db.from('institutes').select('status').eq('id', session.instituteId).single()
    if (inst?.status !== 'ACTIVE') return json({ error: 'Institute is suspended' }, 403)
  }

  const token = await signSession(session)
  const res = json({ role: session.role, name: session.name })
  res.cookies.set(getSessionCookieName(), token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  return res
}
