export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { signSession, getSessionCookieName } from '@/lib/auth'
import type { Role } from '@/lib/auth'
import { handle, json, parse, HttpError, hashPassword } from '@/lib/api'

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  studentPhone: z.string().optional(),
  studentEmail: z.string().optional(),
})

export const POST = handle(async (req) => {
  const input = await parse(req, schema)

  const { data: invite } = await db.from('invite_codes')
    .select('*')
    .eq('code', input.code.toUpperCase())
    .single()
  if (!invite) throw new HttpError(404, 'Invalid invite code')
  if (!invite.is_active) throw new HttpError(400, 'Invite code is deactivated')
  if (invite.expires_at && new Date(invite.expires_at as string) < new Date()) throw new HttpError(400, 'Invite code has expired')
  if ((invite.used_count as number) >= (invite.max_uses as number)) throw new HttpError(400, 'Invite code has reached its maximum uses')

  const { data: institute } = await db.from('institutes').select('status').eq('id', invite.institute_id as string).single()
  if (!institute || institute.status !== 'ACTIVE') throw new HttpError(403, 'Institute is inactive')

  const { data: existing } = await db.from('users_profile').select('id').eq('email', input.email.toLowerCase()).single()
  if (existing) throw new HttpError(400, 'Email already registered')

  const role = (invite.role as string).toUpperCase() as Role
  const profileData: Record<string, unknown> = {
    name: input.name,
    email: input.email.toLowerCase().trim(),
    password_hash: await hashPassword(input.password),
    role,
    institute_id: invite.institute_id,
    phone: input.phone ?? null,
    is_active: true,
    requires_password_change: false,
    fee_status: 'DUE',
  }

  if (role === 'STUDENT') {
    if (input.guardianName) profileData.guardian_name = input.guardianName
    if (input.guardianPhone) profileData.guardian_phone = input.guardianPhone
  }

  if (role === 'PARENT') {
    if (!input.studentPhone && !input.studentEmail) {
      throw new HttpError(400, "Provide your child's phone or email to link accounts")
    }
    let q = db.from('users_profile').select('id').eq('institute_id', invite.institute_id as string).eq('role', 'STUDENT')
    if (input.studentEmail) q = q.eq('email', input.studentEmail.toLowerCase())
    else q = q.eq('phone', input.studentPhone!)
    const { data: stu } = await q.single()
    if (!stu) throw new HttpError(404, 'No student found with that phone or email')
    profileData.student_id = stu.id
  }

  const { data: profile, error } = await db.from('users_profile').insert(profileData).select('id').single()
  if (error) throw new HttpError(500, 'Failed to create user')

  await db.from('invite_codes').update({ used_count: (invite.used_count as number) + 1 }).eq('id', invite.id as string)

  const token = await signSession({
    sub: profile.id as string,
    name: input.name,
    email: input.email.toLowerCase().trim(),
    role,
    instituteId: invite.institute_id as string,
  })

  const res = json({ role, name: input.name }, 201)
  res.cookies.set(getSessionCookieName(), token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  return res
})
