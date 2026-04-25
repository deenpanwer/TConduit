import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new Response('Missing URL', { status: 400 });
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new Response(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response('Failed to fetch image', { status: 500 });
  }
}
