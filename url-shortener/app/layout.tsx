// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // <<<  ADD THIS LINE TO IMPORT YOUR CSS

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { // Updated metadata
  title: 'TinyLink - URL Shortener',
  description: 'A simple and efficient URL shortener. Created with Next.js.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Apply the font className to the body */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}