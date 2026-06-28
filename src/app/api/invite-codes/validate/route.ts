export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { handle, json, HttpError } from '@/lib/api'

export const GET = handle(async (req) => {
  const code = new URL(req.url).searchParams.get('code')
  if (!code) throw new HttpError(400, 'Missing code parameter')

  const { data: inviteCode, error } = await db
    .from('invite_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error || !inviteCode) throw new HttpError(404, 'Invalid invite code')

  const invite = inviteCode as any
  const now = new Date()

  if (!invite.is_active) throw new HttpError(400, 'This invite code has been deactivated')
  if (new Date(invite.expires_at) < now) throw new HttpError(400, 'This invite code has expired')
  if (invite.used_count >= invite.max_uses) throw new HttpError(400, 'This invite code has reached its maximum uses')

  let instituteName = ''
  try {
    const { data: institute } = await db
      .from('institutes')
      .select('name')
      .eq('id', invite.institute_id)
      .single()
    if (institute) instituteName = (institute as any).name
  } catch {}

  return json({
    valid: true,
    role: invite.role,
    instituteName,
    instituteId: invite.institute_id,
    usedCount: invite.used_count,
    maxUses: invite.max_uses,
  })
})
