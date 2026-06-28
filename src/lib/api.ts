import { NextRequest, NextResponse } from 'next/server'
import type { ZodType, z } from 'zod'
import { getSession, Role, Session } from './auth'
import { db } from './db'

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      ...headers
    }
  })
}

export async function auth(roles?: Role[]): Promise<Session> {
  const session = await getSession()
  if (!session) throw new HttpError(401, 'Unauthorized')
  if (roles && !roles.includes(session.role)) throw new HttpError(403, 'Forbidden')
  return session
}

export function instituteOf(session: Session): string {
  if (!session.instituteId) throw new HttpError(403, 'No institute scope')
  return session.instituteId
}

export async function parse<S extends ZodType<any, any, any>>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  const body = await req.json().catch(() => { throw new HttpError(400, 'Invalid JSON body') })
  const result = schema.safeParse(body)
  if (!result.success) throw new HttpError(400, result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
  return result.data
}

type Handler = (req: NextRequest, ctx: any) => Promise<NextResponse>
export function handle(fn: Handler): Handler {
  return async (req, ctx) => {
    try { return await fn(req, ctx) }
    catch (e: any) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status)
      console.error('[UNHANDLED API EXCEPTION]:', e)
      
      const isDev = process.env.NODE_ENV !== 'production'
      const message = isDev ? e.message || 'Internal server error' : 'Internal server error'
      return json({ error: message }, 500)
    }
  }
}

export function csvResponse(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` },
  })
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 10)
}

export async function logAction(instituteId: string, userId: string, action: string, entity: string, entityId?: string, details?: string) {
  const { error } = await db.from('audit_logs').insert({
    institute_id: instituteId,
    user_id: userId,
    action,
    entity,
    entity_id: entityId ?? null,
    details: details ?? null
  })
  if (error) {
    console.error(`FAILED to write audit log: ${error.message}`, error)
  }
}
