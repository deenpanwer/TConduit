
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'problems.csv');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}
