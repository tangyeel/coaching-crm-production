export const dynamic = 'force-dynamic'
import { auth, handle, json } from '@/lib/api'

export const GET = handle(async () => {
  const session = await auth()
  return json(session)
})
