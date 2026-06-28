export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, json, parse, HttpError } from '@/lib/api'

const schema = z.object({
  amount: z.number().positive(),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/),
})

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  await auth(['SUPER_ADMIN'])
  const { amount, periodMonth } = await parse(req, schema)
  
  const { data: institute, error: instErr } = await db
    .from('institutes')
    .select('id')
    .eq('id', params.id)
    .maybeSingle()

  if (instErr || !institute) {
    throw new HttpError(404, 'Institute not found')
  }

  const { data: payment, error } = await db
    .from('payments')
    .insert({
      institute_id: params.id,
      amount,
      period_month: periodMonth,
    })
    .select()
    .single()

  if (error || !payment) throw new HttpError(500, error?.message || 'Failed to record payment')

  return json(payment, 201)
})
