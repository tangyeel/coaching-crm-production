export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { signSession, getSessionCookieName, getSession } from '@/lib/auth'
import { handle, json, parse, HttpError, hashPassword } from '@/lib/api'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  instituteName: z.string().min(2),
  institutePhone: z.string().min(5),
  instituteEmail: z.string().email(),
})

export const POST = handle(async (req) => {
  // Allow if: no super admin exists yet, or caller is SUPER_ADMIN
  const { count } = await db.from('users_profile').select('*', { count: 'exact', head: true }).eq('role', 'SUPER_ADMIN')
  const superAdminExists = (count ?? 0) > 0

  if (superAdminExists) {
    const session = await getSession()
    if (!session || session.role !== 'SUPER_ADMIN') throw new HttpError(403, 'Forbidden')
  }

  const input = await parse(req, schema)

  const { data: existing } = await db.from('users_profile').select('id').eq('email', input.email.toLowerCase()).single()
  if (existing) throw new HttpError(400, 'Email already registered')

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: institute, error: instErr } = await db.from('institutes').insert({
    name: input.instituteName,
    phone: input.institutePhone,
    email: input.instituteEmail,
    status: 'ACTIVE',
    plan: 'BASIC',
    monthly_fee: 0,
    join_code: joinCode,
  }).select('id').single()
  if (instErr) throw new HttpError(500, 'Failed to create institute')

  const { data: profile, error: profErr } = await db.from('users_profile').insert({
    name: input.name,
    email: input.email.toLowerCase().trim(),
    password_hash: await hashPassword(input.password),
    role: 'INSTITUTE_ADMIN',
    institute_id: institute!.id,
    phone: input.phone ?? null,
    is_active: true,
    requires_password_change: false,
    fee_status: 'DUE',
  }).select('id').single()
  if (profErr) throw new HttpError(500, 'Failed to create admin profile')

  // Create default invite codes
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1)
  for (const role of ['teacher', 'student', 'parent']) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await db.from('invite_codes').insert({
      code, institute_id: institute!.id, role, max_uses: 100, used_count: 0,
      expires_at: exp.toISOString(), is_active: true,
    })
  }

  const token = await signSession({
    sub: profile!.id as string,
    name: input.name,
    email: input.email.toLowerCase().trim(),
    role: 'INSTITUTE_ADMIN',
    instituteId: institute!.id as string,
  })

  const res = json({ role: 'INSTITUTE_ADMIN', name: input.name, instituteId: institute!.id as string, joinCode }, 201)
  res.cookies.set(getSessionCookieName(), token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  return res
})
