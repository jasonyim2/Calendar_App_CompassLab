import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { Member } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'members!A2:E', // Assuming row 1 is header
    });
    
    const rows = response.data.values || [];
    const members: Member[] = rows.map((row) => ({
      member_id: row[0] || '',
      name: row[1] || '',
      email: row[2] || '',
      color: row[3] || '',
      is_active: row[4] === 'TRUE',
    })).filter(m => m.is_active);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
