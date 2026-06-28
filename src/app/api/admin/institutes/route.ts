export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, json, parse, HttpError, hashPassword } from '@/lib/api'
import { encrypt } from '@/lib/encryption'

const onboardSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).default('BASIC'),
  monthlyFee: z.number().nonnegative().default(0),
  whatsappToken: z.string().optional(),
  whatsappPhoneId: z.string().optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
})

export const GET = handle(async () => {
  await auth(['SUPER_ADMIN'])
  
  const [instRes, profRes, batchRes, payRes, logsRes] = await Promise.all([
    db.from('institutes').select('*').order('created_at', { ascending: false }).limit(200),
    db.from('users_profile').select('*').limit(5000),
    db.from('batches').select('*').limit(5000),
    db.from('payments').select('*').limit(5000),
    db.from('whatsapp_logs').select('institute_id').limit(10000),
  ])

  const institutes = instRes.data ?? []
  const profiles = profRes.data ?? []
  const batches = batchRes.data ?? []
  const payments = payRes.data ?? []
  const logs = logsRes.data ?? []

  const data = institutes.map((i) => {
    const instProfiles = profiles.filter(p => p.institute_id === i.id)
    const revenue = payments
      .filter(p => p.institute_id === i.id)
      .reduce((s, p) => s + Number(p.amount), 0)
    
    return {
      id: i.id,
      name: i.name,
      email: i.email,
      phone: i.phone,
      address: i.address ?? '',
      status: i.status,
      plan: i.plan,
      monthlyFee: i.monthly_fee ?? 0,
      adminName: i.admin_name ?? '',
      adminEmail: i.admin_email ?? '',
      adminPhone: i.admin_phone ?? '',
      createdAt: i.created_at,
      batches: batches.filter(b => b.institute_id === i.id).length,
      students: instProfiles.filter(p => p.role === 'STUDENT').length,
      teachers: instProfiles.filter(p => p.role === 'TEACHER').length,
      revenue,
      messages: logs.filter(l => l.institute_id === i.id).length,
      joinCode: i.join_code,
    }
  })
  
  return json(data)
})

export const POST = handle(async (req) => {
  await auth(['SUPER_ADMIN'])
  const input = await parse(req, onboardSchema)

  const { data: existing } = await db
    .from('users_profile')
    .select('id')
    .eq('email', input.adminEmail.toLowerCase().trim())
    .maybeSingle()
  
  if (existing) throw new HttpError(400, 'Admin email already in use')

  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: institute, error: instErr } = await db
    .from('institutes')
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      status: 'ACTIVE',
      plan: input.plan,
      monthly_fee: input.monthlyFee,
      whatsapp_token: encrypt(input.whatsappToken) ?? null,
      whatsapp_phone_id: input.whatsappPhoneId ?? null,
      join_code: joinCode,
    })
    .select()
    .single()

  if (instErr || !institute) throw new HttpError(500, instErr?.message || 'Failed to create institute')

  const pwHash = await hashPassword(input.adminPassword)

  const { error: profErr } = await db.from('users_profile').insert({
    institute_id: institute.id,
    role: 'INSTITUTE_ADMIN',
    name: input.adminName,
    email: input.adminEmail.toLowerCase().trim(),
    password_hash: pwHash,
    phone: null,
    requires_password_change: false,
    is_active: true,
    fee_status: 'DUE',
  })

  if (profErr) throw new HttpError(500, 'Failed to create admin profile')

  if (input.monthlyFee > 0) {
    await db.from('payments').insert({
      institute_id: institute.id,
      amount: input.monthlyFee,
      period_month: new Date().toISOString().slice(0, 7),
    })
  }

  return json(institute, 201)
})
