import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT ?? '587')
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const from = process.env.SMTP_FROM ?? 'noreply@coachflow.com'

let transporter: nodemailer.Transporter | null = null

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  })
}

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      })
      console.log(`[EMAIL SENT] to ${to}: ${subject}`)
    } catch (err: any) {
      console.error(`[EMAIL ERROR] failed to send to ${to}:`, err.message)
    }
  } else {
    console.log('-------------------------------------------')
    console.log('[MOCK EMAIL]')
    console.log(`To:      ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body:    ${text || html}`)
    console.log('-------------------------------------------')
  }
}
