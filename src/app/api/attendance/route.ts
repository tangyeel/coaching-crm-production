export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'
import { triggerWebhook } from '@/lib/webhooks'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const url = new URL(req.url)
  const batchId = url.searchParams.get('batchId')
  const date = url.searchParams.get('date')
  if (!batchId || !date) throw new HttpError(400, 'batchId and date are required')

  const { data: batch } = await db.from('batches').select('id').eq('id', batchId).eq('institute_id', instituteId).single()
  if (!batch) throw new HttpError(404, 'Batch not found')

  const [{ data: bs }, { data: att }] = await Promise.all([
    db.from('batch_students').select('student_id').eq('batch_id', batchId),
    db.from('attendance').select('student_id, status').eq('batch_id', batchId).eq('date', date),
  ])
  const studentIds = (bs ?? []).map(s => s.student_id)
  const { data: profiles } = studentIds.length
    ? await db.from('users_profile').select('id, name').in('id', studentIds)
    : { data: [] }

  return json({
    roster: (bs ?? []).map(s => ({
      studentId: s.student_id,
      name: (profiles ?? []).find(p => p.id === s.student_id)?.name ?? '',
    })),
    records: (att ?? []).map(a => ({ studentId: a.student_id, status: a.status })),
  })
})

const postSchema = z.object({
  batchId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
  })).min(1),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, postSchema)

  const { data: batch } = await db.from('batches').select('id').eq('id', input.batchId).eq('institute_id', instituteId).single()
  if (!batch) throw new HttpError(404, 'Batch not found')

  const rows = input.records.map(r => ({
    batch_id: input.batchId,
    student_id: r.studentId,
    institute_id: instituteId,
    date: input.date,
    status: r.status,
    marked_by_id: session.sub,
  }))

  const { error } = await db.from('attendance').upsert(rows, { onConflict: 'batch_id,student_id,date' })
  if (error) throw new HttpError(500, error.message)

  // Queue parent notifications for absent students
  const absentStudents = input.records.filter(r => r.status === 'ABSENT')
  if (absentStudents.length > 0) {
    const studentIds = absentStudents.map(s => s.studentId)
    const { data: students } = await db
      .from('users_profile')
      .select('id, name, phone, guardian_phone')
      .in('id', studentIds)
    
    if (students && students.length > 0) {
      const queueRows = []
      for (const student of students) {
        const recipientPhone = student.guardian_phone || student.phone
        if (!recipientPhone) continue

        queueRows.push({
          institute_id: instituteId,
          recipient: recipientPhone,
          type: 'ABSENT',
          payload: JSON.stringify({
            studentName: student.name,
            date: input.date,
          }),
          status: 'PENDING',
        })
      }

      if (queueRows.length > 0) {
        await db.from('notification_queue').insert(queueRows)
      }
    }
  }

  triggerWebhook(instituteId, 'attendance.marked', {
    batchId: input.batchId,
    date: input.date,
    records: input.records
  })

  return json({ ok: true, saved: input.records.length })
})
