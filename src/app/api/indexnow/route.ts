import { NextResponse } from 'next/server';
import sitemap from '@/app/sitemap';

const INDEXNOW_KEY = '7e9f3b5a1c0d4e9b8f2a6c8d7e9f3b5a';
const INDEXNOW_HOST = 'www.heytracai.com';
const INDEXNOW_URL = 'https://api.indexnow.org/IndexNow';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Optional basic validation to avoid unauthorized triggering
    const expectedSecret = process.env.INDEXNOW_SECRET || 'tracai_indexnow_2026';
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized. Please provide correct secret.' }, { status: 401 });
    }

    // Dynamic retrieval of all sitemap public URLs
    const sitemapData = await sitemap();
    const urls = sitemapData.map((item) => item.url);

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs found to submit.' }, { status: 400 });
    }

    // Submit to IndexNow
    const response = await fetch(INDEXNOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `Successfully submitted ${urls.length} URLs to IndexNow.`,
        urlsSubmittedCount: urls.length,
        urls,
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `IndexNow API returned status ${response.status}: ${errorText}`,
      }, { status: response.status });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
