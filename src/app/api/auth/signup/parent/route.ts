import { z } from 'zod'
import { db } from '@/lib/db'
import { signSession, getSessionCookieName } from '@/lib/auth'
import { handle, json, parse, HttpError, hashPassword } from '@/lib/api'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(10),
})

export const POST = handle(async (req) => {
  const input = await parse(req, schema)

  // 1. Check if email already registered
  const { data: existing } = await db.from('users_profile').select('id').eq('email', input.email.toLowerCase().trim()).maybeSingle()
  if (existing) throw new HttpError(400, 'Email already registered')

  // 2. Find student by matching parent's phone with student's guardian_phone
  const parentDigits = String(input.phone || '').replace(/\D/g, '')
  if (parentDigits.length < 10) throw new HttpError(400, 'Invalid phone number format')

  const { data: students } = await db
    .from('users_profile')
    .select('id, institute_id, guardian_phone')
    .eq('role', 'STUDENT')
    .not('guardian_phone', 'is', null)

  const student = (students ?? []).find((s: any) => {
    const gDigits = String(s.guardian_phone || '').replace(/\D/g, '')
    return gDigits === parentDigits || (gDigits.length >= 10 && parentDigits.endsWith(gDigits)) || (parentDigits.length >= 10 && gDigits.endsWith(parentDigits))
  })

  if (!student) {
    throw new HttpError(404, 'Your phone number is not registered as a guardian for any student. Please check with the institute.')
  }

  // 3. Create parent profile
  const parentPwHash = await hashPassword(input.password)
  const { data: parent, error: parentErr } = await db
    .from('users_profile')
    .insert({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      password_hash: parentPwHash,
      role: 'PARENT',
      institute_id: student.institute_id,
      phone: input.phone,
      student_id: student.id,
      is_active: true,
      requires_password_change: false,
      fee_status: 'PAID'
    })
    .select('id')
    .single()

  if (parentErr || !parent) throw new HttpError(500, 'Failed to create parent profile')

  // 4. Create and set auth token
  const token = await signSession({
    sub: parent.id as string,
    name: input.name,
    email: input.email.toLowerCase().trim(),
    role: 'PARENT',
    instituteId: student.institute_id as string,
  })

  const res = json({ role: 'PARENT', name: input.name }, 201)
  res.cookies.set(getSessionCookieName(), token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  return res
})
