import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';
import { Event } from '@/types';
import { parseISO, lastDayOfMonth, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'events!A2:L',
    });
    
    const rows = response.data.values || [];
    let events: Event[] = rows.map((row) => ({
      event_id: row[0] || '',
      type: row[1] || '',
      sub_type: row[2] || '',
      title: row[3] || '',
      start_date: row[4] || '',
      end_date: row[5] || '',
      start_time: row[6] || '',
      duration_h: row[7] || '',
      member_ids: row[8] || '',
      client: row[9] || '',
      location: row[10] || '',
      notes: row[11] || '',
    }));

    if (year && month) {
      const monthStart = `${year}-${month.padStart(2, '0')}-01`;
      const monthEnd = format(lastDayOfMonth(parseISO(monthStart)), 'yyyy-MM-dd');
      
      events = events.filter((e) => {
        // Event overlaps if start <= monthEnd AND end >= monthStart
        return e.start_date <= monthEnd && e.end_date >= monthStart;
      });
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Fetch existing to determine next event_id
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'events!A2:A',
    });
    const rows = response.data.values || [];
    
    let maxId = 0;
    for (const row of rows) {
      if (row[0] && row[0].startsWith('EVT-')) {
        const num = parseInt(row[0].split('-')[1], 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    }
    const newId = `EVT-${String(maxId + 1).padStart(3, '0')}`;
    
    const newEvent: Event = {
      event_id: newId,
      type: body.type || '',
      sub_type: body.sub_type || '',
      title: body.title || '',
      start_date: body.start_date || '',
      end_date: body.end_date || body.start_date, // fallback to start_date
      start_time: body.start_time || '',
      duration_h: body.duration_h || '',
      member_ids: body.member_ids || '',
      client: body.client || '',
      location: body.location || '',
      notes: body.notes || '',
    };

    const rowData = [
      newEvent.event_id,
      newEvent.type,
      newEvent.sub_type,
      newEvent.title,
      newEvent.start_date,
      newEvent.end_date,
      newEvent.start_time,
      newEvent.duration_h,
      newEvent.member_ids,
      newEvent.client,
      newEvent.location,
      newEvent.notes,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'events!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
