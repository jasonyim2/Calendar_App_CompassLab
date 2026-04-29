import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/googleSheets';

export async function PUT(request: Request, { params }: { params: Promise<{ event_id: string }> }) {
  try {
    const { event_id } = await params;
    const body = await request.json();
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'events!A:A',
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === event_id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const sheetRowNumber = rowIndex + 1;
    
    const rowData = [
      event_id,
      body.type || '',
      body.sub_type || '',
      body.title || '',
      body.start_date || '',
      body.end_date || body.start_date,
      body.start_time || '',
      body.duration_h || '',
      body.member_ids || '',
      body.client || '',
      body.location || '',
      body.notes || '',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `events!A${sheetRowNumber}:L${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ event_id: string }> }) {
  try {
    const { event_id } = await params;
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'events!A:A',
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === event_id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheet = metadata.data.sheets?.find(s => s.properties?.title === 'events');
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) {
      return NextResponse.json({ error: 'events sheet not found' }, { status: 500 });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
