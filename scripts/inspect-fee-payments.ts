import { Client } from 'pg'

const connectionString = 'postgresql://postgres:8RZ0HURDW2u9AsNW@db.getwvnznpwtbbjdrudug.supabase.co:5432/postgres'

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()

  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'fee_payments';
  `)

  console.log('--- fee_payments columns ---')
  console.table(res.rows)

  const invoicesRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'invoices';
  `)

  console.log('--- invoices columns ---')
  console.table(invoicesRes.rows)

  await client.end()
}

run().catch(console.error)
