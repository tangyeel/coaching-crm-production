export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, json, HttpError, hashPassword } from '@/lib/api'

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  await auth(['SUPER_ADMIN'])

  const { data: institute, error } = await db
    .from('institutes')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !institute) {
    throw new HttpError(404, 'Institute not found')
  }

  const inst = institute as any

  if (inst.status !== 'PENDING') {
    throw new HttpError(400, 'Institute is not in PENDING status')
  }

  const pwHash = await hashPassword('changeme123')

  const { error: profErr } = await db.from('users_profile').insert({
    institute_id: inst.id,
    role: 'INSTITUTE_ADMIN',
    name: inst.admin_name,
    email: (inst.admin_email as string).toLowerCase().trim(),
    password_hash: pwHash,
    phone: inst.admin_phone ?? null,
    is_active: true,
    requires_password_change: true,
    fee_status: 'DUE',
  })

  if (profErr) throw new HttpError(500, profErr.message)

  await db.from('institutes').update({ status: 'ACTIVE' }).eq('id', inst.id)

  return json({ message: 'Institute approved and admin account created' })
})
