export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, handle, instituteOf, json, parse, HttpError, logAction, hashPassword } from '@/lib/api'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const importSchema = z.object({
  csvData: z.string(),
  batchIds: z.array(z.string()).default([]),
})

export const POST = handle(async (req) => {
  const session = await auth(['INSTITUTE_ADMIN', 'TEACHER'])
  const instituteId = instituteOf(session)
  const input = await parse(req, importSchema)

  let parsedStudents: any[] = []
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a data extraction assistant. Map this CSV to a JSON array with fields: name, email, phone, guardianName, guardianPhone. If no email exists, generate <firstname>.<lastname>@temp.local. Return ONLY the raw JSON array, no markdown.\n\nCSV:\n${input.csvData}`,
      }],
      temperature: 0,
    })
    const raw = completion.choices[0]?.message?.content || '[]'
    const match = raw.match(/\[[\s\S]*\]/)
    parsedStudents = JSON.parse(match ? match[0] : raw)
  } catch {
    throw new HttpError(400, 'Failed to parse CSV data using AI.')
  }

  if (!Array.isArray(parsedStudents) || parsedStudents.length === 0) {
    throw new HttpError(400, 'No valid students found in the parsed data.')
  }

  let importedCount = 0
  const importedStudents: { name: string; email: string; tempPassword: string }[] = []

  for (const stu of parsedStudents) {
    const { data: exists } = await db
      .from('users_profile')
      .select('id')
      .eq('email', stu.email.toLowerCase().trim())
      .maybeSingle()
    if (exists) continue

    const tempPassword = Math.random().toString(36).substring(2, 10)
    const pwHash = await hashPassword(tempPassword)

    const { data: profile, error: profErr } = await db
      .from('users_profile')
      .insert({
        institute_id: instituteId,
        role: 'STUDENT',
        name: stu.name,
        email: stu.email.toLowerCase().trim(),
        password_hash: pwHash,
        phone: stu.phone || null,
        guardian_name: stu.guardianName || null,
        guardian_phone: stu.guardianPhone || null,
        fee_status: 'DUE',
        requires_password_change: true,
        is_active: true,
      })
      .select()
      .single()

    if (profErr || !profile) continue

    for (const batchId of input.batchIds) {
      await db.from('batch_students').insert({
        batch_id: batchId,
        student_id: profile.id,
      })
    }

    importedStudents.push({ name: stu.name, email: stu.email, tempPassword })
    importedCount++
  }

  await logAction(instituteId, session.sub, 'IMPORT_STUDENTS', 'Student', undefined, `Imported ${importedCount} students via AI parsing.`)
  return json({ message: `Successfully imported ${importedCount} students.`, importedCount, students: importedStudents }, 201)
})
