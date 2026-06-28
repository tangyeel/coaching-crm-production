export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const GET = handle(async () => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)

  const { data: codes, error } = await db
    .from('invite_codes')
    .select('*')
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new HttpError(500, error.message)

  const now = new Date()
  const result = (codes ?? []).map((c: any) => ({
    id: c.id,
    code: c.code,
    role: c.role,
    max_uses: c.max_uses,
    used_count: c.used_count,
    expires_at: c.expires_at,
    is_active: c.is_active,
    is_expired: new Date(c.expires_at) < now,
    usage_pct: c.max_uses > 0 ? Math.round((c.used_count / c.max_uses) * 100) : 0,
    $createdAt: c.created_at,
  }))

  return json(result)
})

const createSchema = z.object({
  role: z.enum(['teacher', 'student', 'parent']),
  maxUses: z.number().int().positive().default(50),
  expiresInDays: z.number().int().positive().default(30),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, createSchema)

  let code: string
  let attempts = 0
  do {
    code = generateCode()
    const { data: existing } = await db
      .from('invite_codes')
      .select('id')
      .eq('code', code)
      .maybeSingle()
    if (!existing) break
    attempts++
  } while (attempts < 10)

  if (attempts >= 10) {
    throw new HttpError(500, 'Failed to generate unique code')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

  const { data: doc, error } = await db
    .from('invite_codes')
    .insert({
      code,
      institute_id: instituteId,
      role: input.role,
      max_uses: input.maxUses,
      used_count: 0,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single()

  if (error || !doc) throw new HttpError(500, error?.message || 'Failed to create invite code')

  return json({
    id: doc.id,
    code: doc.code,
    role: doc.role,
    max_uses: doc.max_uses,
    expires_at: doc.expires_at,
  }, 201)
})
