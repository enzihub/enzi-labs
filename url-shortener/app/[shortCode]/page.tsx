// app/[shortCode]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { getUrlByShortCode } from '@/lib/data';

// Short links are resolved at request time from the in-memory store
export const dynamic = 'force-dynamic';

interface ShortCodePageProps {
  params: Promise<{ shortCode: string }>;
}

export default async function ShortCodePage({ params }: ShortCodePageProps) {
  const { shortCode } = await params;

  if (!shortCode || typeof shortCode !== 'string') {
    notFound();
  }

  const urlEntry = getUrlByShortCode(shortCode);

  if (urlEntry && urlEntry.longUrl) {
    redirect(urlEntry.longUrl);
  } else {
    notFound();
  }
}
