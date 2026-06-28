export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, json, HttpError } from '@/lib/api'

export const GET = handle(async () => {
  await auth(['SUPER_ADMIN'])

  const { data: analytics, error } = await db.rpc('get_admin_analytics')
  if (error) throw new HttpError(500, error.message)

  const { data: dbSizeData } = await db.rpc('get_db_size')
  const dbSize = Number(dbSizeData ?? 0)

  return json({
    ...(analytics as Record<string, any>),
    dbSize,
  })
})
