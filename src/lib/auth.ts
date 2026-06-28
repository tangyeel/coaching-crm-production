import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { db } from './db'

export type Role = 'SUPER_ADMIN' | 'INSTITUTE_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface Session {
  sub: string          // users_profile.id
  name: string
  email: string
  role: Role
  instituteId: string | null
}

const SESSION_COOKIE = 'cf-session'
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set!")
}
const secret = new TextEncoder().encode(jwtSecret)

export async function signSession(payload: Session): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(secret)
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as Session
  } catch {
    return null
  }
}

export function getSessionCookieName() { return SESSION_COOKIE }

/** Verify email+password against users_profile + password_hash, return session payload */
export async function verifyCredentials(email: string, password: string): Promise<Session | null> {
  const bcrypt = await import('bcryptjs')
  const { data: profile } = await db
    .from('users_profile')
    .select('id, name, email, role, institute_id, password_hash')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .single()
  if (!profile) return null
  const ok = await bcrypt.compare(password, profile.password_hash as string)
  if (!ok) return null
  return {
    sub: profile.id as string,
    name: profile.name as string,
    email: profile.email as string,
    role: profile.role as Role,
    instituteId: (profile.institute_id as string | null) ?? null,
  }
}
