export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, json, HttpError } from '@/lib/api'

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  await auth(['SUPER_ADMIN'])

  const { data: institute, error } = await db
    .from('institutes')
    .select('id, status')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !institute) {
    throw new HttpError(404, 'Institute not found')
  }

  if (institute.status !== 'PENDING') {
    throw new HttpError(400, 'Institute is not in PENDING status')
  }

  const { error: updateErr } = await db
    .from('institutes')
    .update({ status: 'REJECTED' })
    .eq('id', params.id)

  if (updateErr) throw new HttpError(500, updateErr.message)

  return json({ message: 'Onboarding request rejected' })
})
