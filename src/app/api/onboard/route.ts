export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { handle, json, parse, HttpError } from '@/lib/api'

const onboardSchema = z.object({
  instituteName: z.string().min(2),
  institutePhone: z.string().min(5),
  instituteEmail: z.string().email(),
  instituteAddress: z.string().min(5),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPhone: z.string().optional(),
})

export const POST = handle(async (req) => {
  const input = await parse(req, onboardSchema)

  const { data: existing } = await db
    .from('institutes')
    .select('id')
    .eq('email', input.instituteEmail)
    .maybeSingle()
  if (existing) {
    throw new HttpError(400, 'An institute with this email already exists')
  }

  const { data: existingAdmin } = await db
    .from('users_profile')
    .select('id')
    .eq('email', input.adminEmail.toLowerCase().trim())
    .maybeSingle()
  if (existingAdmin) {
    throw new HttpError(400, 'This admin email is already registered')
  }

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { error } = await db.from('institutes').insert({
    name: input.instituteName,
    phone: input.institutePhone,
    email: input.instituteEmail,
    address: input.instituteAddress,
    admin_name: input.adminName,
    admin_email: input.adminEmail,
    admin_phone: input.adminPhone ?? null,
    status: 'PENDING',
    plan: 'BASIC',
    monthly_fee: 0,
    join_code: joinCode,
  })

  if (error) throw new HttpError(500, error.message)

  return json({ message: 'Your onboarding request has been submitted! The admin will review it shortly.' }, 201)
})
