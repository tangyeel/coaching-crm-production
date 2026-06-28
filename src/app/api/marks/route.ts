export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError } from '@/lib/api'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const examId = new URL(req.url).searchParams.get('examId')
  if (!examId) throw new HttpError(400, 'examId is required')

  const { data: exam } = await db.from('exams').select('*').eq('id', examId).eq('institute_id', instituteId).single()
  if (!exam) throw new HttpError(404, 'Exam not found')

  const [{ data: bs }, { data: marksData }] = await Promise.all([
    db.from('batch_students').select('student_id').eq('batch_id', exam.batch_id as string),
    db.from('marks').select('student_id, score').eq('exam_id', examId),
  ])
  const studentIds = (bs ?? []).map(s => s.student_id)
  const { data: profiles } = studentIds.length
    ? await db.from('users_profile').select('id, name').in('id', studentIds)
    : { data: [] }

  return json({
    exam: { id: exam.id, name: exam.name, maxMarks: exam.max_marks },
    roster: (bs ?? []).map(s => ({
      studentId: s.student_id,
      name: (profiles ?? []).find(p => p.id === s.student_id)?.name ?? '',
    })),
    marks: (marksData ?? []).map(m => ({
      studentId: m.student_id,
      score: m.score === -1 ? 'AB' : String(m.score),
    })),
  })
})

const postSchema = z.object({
  examId: z.string(),
  marks: z.array(z.object({ studentId: z.string(), score: z.string() })).min(1),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, postSchema)

  const { data: exam } = await db.from('exams').select('*').eq('id', input.examId).eq('institute_id', instituteId).single()
  if (!exam) throw new HttpError(404, 'Exam not found')

  const rows = input.marks.map(m => {
    const num = Number(m.score)
    if (!isNaN(num) && num > (exam.max_marks as number)) throw new HttpError(400, `Score exceeds max marks (${exam.max_marks})`)
    const score = m.score.toUpperCase() === 'AB' ? -1 : Number(m.score)
    return { exam_id: input.examId, student_id: m.studentId, institute_id: instituteId, score }
  })

  const { error } = await db.from('marks').upsert(rows, { onConflict: 'exam_id,student_id' })
  if (error) throw new HttpError(500, error.message)

  // Queue parent notifications for entered marks
  const studentIds = input.marks.map(m => m.studentId)
  if (studentIds.length > 0) {
    const { data: students } = await db
      .from('users_profile')
      .select('id, name, phone, guardian_phone')
      .in('id', studentIds)
    
    if (students && students.length > 0) {
      const queueRows = []
      for (const m of input.marks) {
        const student = students.find(s => s.id === m.studentId)
        if (!student) continue
        const recipientPhone = student.guardian_phone || student.phone
        if (!recipientPhone) continue

        const scoreStr = m.score.toUpperCase() === 'AB' ? 'AB' : m.score
        queueRows.push({
          institute_id: instituteId,
          recipient: recipientPhone,
          type: 'MARKS',
          payload: JSON.stringify({
            studentName: student.name,
            score: scoreStr,
            maxMarks: exam.max_marks,
            examName: exam.name,
            date: exam.date || new Date().toLocaleDateString(),
          }),
          status: 'PENDING',
        })
      }

      if (queueRows.length > 0) {
        await db.from('notification_queue').insert(queueRows)
      }
    }
  }

  return json({ ok: true, saved: input.marks.length })
})
