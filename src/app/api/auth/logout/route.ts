export const dynamic = 'force-dynamic'
import { handle, json } from '@/lib/api'
import { getSessionCookieName } from '@/lib/auth'

export const POST = handle(async () => {
  const res = json({ ok: true })
  res.cookies.set(getSessionCookieName(), '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
})
