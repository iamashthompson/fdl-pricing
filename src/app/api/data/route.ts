import { getDb, initDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await initDb();
    const sql = getDb();
    const rows = await sql`SELECT data FROM app_data WHERE id = 'main'`;
    if (rows.length === 0) {
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ data: rows[0].data });
  } catch (error) {
    console.error('Failed to load:', error);
    return NextResponse.json({ data: null, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const sql = getDb();
    const body = await request.json();
    await sql`
      INSERT INTO app_data (id, data, updated_at) 
      VALUES ('main', ${JSON.stringify(body)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(body)}::jsonb, updated_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
