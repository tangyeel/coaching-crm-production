export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { auth, handle, json, HttpError } from '@/lib/api'

export const GET = handle(async () => {
  const session = await auth(['STUDENT', 'PARENT'])
  
  let studentId = session.sub
  if (session.role === 'PARENT') {
    const { data: parentData } = await db
      .from('users_profile')
      .select('student_id')
      .eq('id', session.sub)
      .single()
    
    const parent = parentData as any
    if (!parent || !parent.student_id) {
      throw new HttpError(404, 'Linked student profile not found')
    }
    studentId = parent.student_id
  }

  // 1. Fetch Student Profile
  const { data: studentData, error: studentErr } = await db
    .from('users_profile')
    .select('*')
    .eq('id', studentId)
    .single()

  if (studentErr || !studentData) {
    throw new HttpError(404, 'Student profile not found')
  }
  const student = studentData as any

  // 2. Fetch Enrollments / Batches
  const { data: enrollments } = await db
    .from('batch_students')
    .select('batch_id, batch:batches(*)')
    .eq('student_id', studentId)

  const batches = (enrollments ?? []).map((e: any) => e.batch).filter(Boolean)
  const batchIds = batches.map((b: any) => b.id)

  // 3. Fetch Attendance
  const { data: attendance } = await db
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(100)

  // 4. Fetch Marks & Exams
  const { data: marks } = await db
    .from('marks')
    .select('score, exam_id, exam:exams(*)')
    .eq('student_id', studentId)

  // 5. Fetch Invoices
  const { data: invoices } = await db
    .from('invoices')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  // 6. Fetch Announcements
  const { data: announcements } = await db
    .from('announcements')
    .select('*')
    .eq('institute_id', student.institute_id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Filter announcements for general or student's batches
  const myAnns = (announcements ?? []).filter(
    (a: any) => !a.batch_id || batchIds.includes(a.batch_id)
  )

  // 7. Calculate stats
  const attTotal = attendance?.length ?? 0
  const attPresent = attendance?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length ?? 0
  const attendancePercentage = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 100

  const results = (marks ?? []).map((m: any) => {
    const maxMarks = m.exam?.max_marks ?? 100
    const pct = Math.round((m.score / maxMarks) * 100)
    return {
      id: m.exam_id,
      name: m.exam?.name ?? 'Exam',
      subject: m.exam?.subject ?? 'Subject',
      date: m.exam?.date ?? '',
      score: m.score === -1 ? 'AB' : m.score,
      total: maxMarks,
      pct: m.score === -1 ? 0 : pct,
      grade: m.score === -1 ? 'F' : pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F',
    }
  })

  const averagePercentage = results.length > 0 ? Math.round(results.reduce((s: number, r: any) => s + r.pct, 0) / results.length) : 0
  const bestPercentage = results.length > 0 ? Math.max(...results.map((r: any) => r.pct)) : 0

  const pendingInvoices = (invoices ?? []).filter((i: any) => i.status !== 'PAID')
  const pendingFeesAmount = pendingInvoices.reduce((s: number, i: any) => s + Number(i.total_amount), 0)

  return json({
    student,
    batches,
    attendance: {
      percentage: attendancePercentage,
      records: attendance ?? [],
    },
    results,
    averagePercentage,
    bestPercentage,
    invoices: invoices ?? [],
    pendingFeesAmount,
    pendingInvoicesCount: pendingInvoices.length,
    announcements: myAnns.slice(0, 10),
  })
})
