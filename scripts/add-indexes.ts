import { Client } from 'pg'

const connectionString = 'postgresql://postgres:8RZ0HURDW2u9AsNW@db.getwvnznpwtbbjdrudug.supabase.co:5432/postgres'

const indexesSQL = `
CREATE INDEX IF NOT EXISTS idx_users_profile_institute_id ON users_profile(institute_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_student_id ON users_profile(student_id);
CREATE INDEX IF NOT EXISTS idx_batches_institute_id ON batches(institute_id);
CREATE INDEX IF NOT EXISTS idx_batches_teacher_id ON batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student_id ON batch_students(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_institute_id ON exams(institute_id);
CREATE INDEX IF NOT EXISTS idx_exams_batch_id ON exams(batch_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_id ON marks(exam_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_id ON attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_institute_id ON attendance(institute_id);
CREATE INDEX IF NOT EXISTS idx_announcements_institute_id ON announcements(institute_id);
CREATE INDEX IF NOT EXISTS idx_announcements_batch_id ON announcements(batch_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_institute_id ON fee_payments(institute_id);
CREATE INDEX IF NOT EXISTS idx_payments_institute_id ON payments(institute_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_institute_id ON audit_logs(institute_id);
CREATE INDEX IF NOT EXISTS idx_invoices_institute_id ON invoices(institute_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_institute_id ON whatsapp_logs(institute_id);
`

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()
  console.log('Connected to PostgreSQL database.')

  try {
    await client.query(indexesSQL)
    console.log('✅ Created database indexes successfully.')
  } catch (err: any) {
    console.error('❌ Failed to create indexes:', err.message)
  }

  await client.end()
  console.log('Database connection closed.')
}

run().catch(console.error)
