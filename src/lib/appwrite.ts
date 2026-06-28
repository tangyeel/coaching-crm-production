import { Client, Databases, Account, Users } from 'node-appwrite'

export const DB_ID = 'coaching-crm'

export const C = {
  INSTITUTES: 'institutes',
  USERS_PROFILE: 'users_profile',
  BATCHES: 'batches',
  BATCH_STUDENTS: 'batch_students',
  EXAMS: 'exams',
  MARKS: 'marks',
  ATTENDANCE: 'attendance',
  ANNOUNCEMENTS: 'announcements',
  FEE_PAYMENTS: 'fee_payments',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  RATE_LIMITS: 'rate_limits',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  NOTIFICATION_QUEUE: 'notification_queue',
  AUDIT_LOGS: 'audit_logs',
  INVITE_CODES: 'invite_codes',
  WHATSAPP_LOGS: 'whatsapp_logs',
  NOTIFICATIONS: 'notifications',
} as const

/** Admin client — uses API key, for server-side operations */
function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)
  return {
    databases: new Databases(client),
    users: new Users(client),
    account: new Account(client),
  }
}

/** Session client — uses a user session secret */
function createSessionClient(sessionSecret: string) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setSession(sessionSecret)
  return {
    account: new Account(client),
    databases: new Databases(client),
  }
}

// Singleton for admin client (reused across requests in same process)
const globalForAppwrite = globalThis as unknown as { _awAdmin?: ReturnType<typeof createAdminClient> }
export const adminClient = globalForAppwrite._awAdmin ?? createAdminClient()
if (process.env.NODE_ENV !== 'production') globalForAppwrite._awAdmin = adminClient

export { createSessionClient }
