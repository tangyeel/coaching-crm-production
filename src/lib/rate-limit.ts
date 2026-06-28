import { db } from './db'
import { HttpError } from './api'

export async function checkRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const now = new Date()
  const { data, error } = await db
    .from('rate_limits')
    .select('id, key, count, expires_at')
    .eq('key', key)
    .maybeSingle()

  if (error) {
    console.error('Rate limit query error:', error.message)
  }

  if (data) {
    const expiresAt = new Date(data.expires_at as string)

    if (expiresAt < now) {
      // Expired — reset
      await db.from('rate_limits').update({
        count: 1,
        expires_at: new Date(now.getTime() + windowMs).toISOString(),
      }).eq('id', data.id as string)
      return
    }

    if ((data.count as number) >= maxAttempts) {
      const waitMinutes = Math.ceil((expiresAt.getTime() - now.getTime()) / 60000)
      throw new HttpError(429, `Too many attempts. Please try again in ${waitMinutes} minutes.`)
    }

    await db.from('rate_limits').update({
      count: (data.count as number) + 1,
    }).eq('id', data.id as string)
  } else {
    await db.from('rate_limits').insert({
      key,
      count: 1,
      expires_at: new Date(now.getTime() + windowMs).toISOString(),
    })
  }
}
