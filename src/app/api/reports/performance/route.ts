export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, csvResponse, handle, instituteOf, json, HttpError } from '@/lib/api'

const grade = (pct: number) =>
  pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'

export const GET = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const url = new URL(req.url)
  const batchId = url.searchParams.get('batchId')
  if (!batchId) throw new HttpError(400, 'batchId is required')

  const { data: batch, error: batchErr } = await db
    .from('batches')
    .select('id, name')
    .eq('id', batchId)
    .eq('institute_id', instituteId)
    .maybeSingle()
  if (batchErr || !batch) throw new HttpError(404, 'Batch not found')

  const [bsRes, examsRes] = await Promise.all([
    db.from('batch_students').select('student_id').eq('batch_id', batchId).limit(500),
    db.from('exams').select('*').eq('batch_id', batchId).order('date', { ascending: true }).limit(200),
  ])

  const studentIds = (bsRes.data ?? []).map(bs => bs.student_id)
  const examIds = (examsRes.data ?? []).map(e => e.id)

  const [profilesRes, marksRes] = await Promise.all([
    studentIds.length > 0
      ? db.from('users_profile').select('id, name').in('id', studentIds).limit(500)
      : Promise.resolve({ data: [] }),
    examIds.length > 0
      ? db.from('marks').select('exam_id, student_id, score').in('exam_id', examIds).limit(5000)
      : Promise.resolve({ data: [] }),
  ])

  const profiles = profilesRes.data ?? []
  const marks = marksRes.data ?? []
  const exams = examsRes.data ?? []

  const rows = (bsRes.data ?? []).map(bs => {
    const name = (profiles ?? []).find(p => p.id === bs.student_id)?.name ?? ''
    let scored = 0
    let possible = 0
    const perExam = exams.map(e => {
      const mark = (marks ?? []).find(m => m.exam_id === e.id && m.student_id === bs.student_id)
      if (mark && mark.score !== -1) {
        scored += Number(mark.score)
        possible += Number(e.max_marks)
      }
      return { exam: e.name, score: mark?.score === -1 ? 'AB' : (mark?.score ?? null), maxMarks: e.max_marks }
    })
    const pct = possible > 0 ? Math.round((scored / possible) * 100) : null
    return { studentId: bs.student_id, name, perExam, percentage: pct, grade: pct !== null ? grade(pct) : null }
  })

  if (url.searchParams.get('format') === 'csv') {
    return csvResponse(`performance-${batch.name}.csv`, [
      ['Student', ...exams.map(e => `${e.name} (/${e.max_marks})`), 'Overall %', 'Grade'],
      ...rows.map(r => [r.name, ...r.perExam.map(p => p.score ?? '-'), r.percentage ?? 'N/A', r.grade ?? 'N/A'] as (string | number)[]),
    ])
  }
  return json({
    batch: { id: batch.id, name: batch.name },
    exams: exams.map(e => ({ id: e.id, name: e.name, maxMarks: e.max_marks })),
    rows,
  })
})
