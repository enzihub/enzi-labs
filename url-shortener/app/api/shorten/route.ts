// app/api/shorten/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addUrl, getUrlByLongUrl, getNextId } from '@/lib/data';
import { idToBase62 } from '@/lib/base62';

export async function POST(req: NextRequest) {
  try {
    const { longUrl } = await req.json();

    if (!longUrl || typeof longUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    // Validate URL format (simple check)
    try {
      new URL(longUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check if longURL already exists (as per requirements)
    const existingEntry = getUrlByLongUrl(longUrl);
    if (existingEntry) {
      const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/${existingEntry.shortCode}`;
      return NextResponse.json({ shortUrl, originalUrl: longUrl }, { status: 200 });
    }

    // Generate new unique ID and convert to base62
    const newId = getNextId();
    const shortCode = idToBase62(newId);

    // Store the mapping
    addUrl(longUrl, shortCode);

    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin}/${shortCode}`;

    return NextResponse.json({ shortUrl, originalUrl: longUrl }, { status: 201 });

  } catch (error) {
    console.error("Error in /api/shorten:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}