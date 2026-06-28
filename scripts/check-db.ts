import 'dotenv/config'
import { Client, Databases } from 'node-appwrite'
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)
const db = new Databases(client)
db.list().then(r => {
  console.log('Databases:', JSON.stringify(r.databases.map((d: any) => ({ id: d['$id'], name: d.name })), null, 2))
}).catch((e: any) => console.error('Error:', e.message))
