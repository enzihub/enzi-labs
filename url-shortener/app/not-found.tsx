// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center p-4">
      <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">Link Not Found</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Oops! The short link you tried to access doesn&apos;t exist or may have expired.
      </p>
      <Link href="/" className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Go Home
      </Link>
    </div>
  );
}