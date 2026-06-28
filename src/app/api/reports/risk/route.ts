export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json } from '@/lib/api'

export const GET = handle(async () => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)

  const { data: students } = await db
    .from('users_profile')
    .select('*')
    .eq('institute_id', instituteId)
    .eq('role', 'STUDENT')
    .limit(500)

  const studentIds = (students ?? []).map(s => s.id)
  if (studentIds.length === 0) return json({ atRisk: [] })

  const [attRes, marksRes, examsRes] = await Promise.all([
    db.from('attendance').select('student_id, status').in('student_id', studentIds).limit(10000),
    db.from('marks').select('student_id, exam_id, score').in('student_id', studentIds).limit(5000),
    db.from('exams').select('id, max_marks').eq('institute_id', instituteId).limit(500),
  ])

  const attendance = attRes.data ?? []
  const marks = marksRes.data ?? []
  const exams = examsRes.data ?? []

  const atRisk = []
  for (const s of (students ?? [])) {
    const riskFactors: string[] = []
    const att = attendance.filter(a => a.student_id === s.id)
    if (att.length > 0) {
      const pct = Math.round(((att.filter(a => a.status !== 'ABSENT').length) / att.length) * 100)
      if (pct < 75) riskFactors.push(`Low Attendance (${pct}%)`)
    }
    const studentMarks = marks.filter(m => m.student_id === s.id)
    let scored = 0
    let possible = 0
    for (const m of studentMarks) {
      const exam = exams.find(e => e.id === m.exam_id)
      if (exam && m.score !== -1) {
        scored += Number(m.score)
        possible += Number(exam.max_marks)
      }
    }
    if (possible > 0) {
      const pct = Math.round((scored / possible) * 100)
      if (pct < 50) riskFactors.push(`Low Grades (${pct}%)`)
    }
    if (riskFactors.length > 0) {
      atRisk.push({
        studentId: s.id,
        name: s.name,
        guardianName: s.guardian_name,
        guardianPhone: s.guardian_phone,
        riskFactors,
      })
    }
  }
  return json({ atRisk })
})
