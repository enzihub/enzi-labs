// app/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import Head from 'next/head';

interface ShortenResponse {
  shortUrl: string;
  originalUrl: string;
}

interface ErrorResponse {
  error: string;
}

export default function HomePage() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setShortUrl('');
    setIsLoading(true);
    setCopied(false);

    if (!longUrl.trim()) {
      setError('Please enter a URL to shorten.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ longUrl }),
      });

      const data: ShortenResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        setError((data as ErrorResponse).error || 'Failed to shorten URL.');
      } else {
        setShortUrl((data as ShortenResponse).shortUrl);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000); // Reset copied status after 2 seconds
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          setError('Failed to copy URL to clipboard.');
        });
    }
  };

  return (
    <>
      <Head>
        <title>TinyLink - URL Shortener</title>
        <meta name="description" content="A simple and efficient URL shortener." />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-md shadow-2xl rounded-xl p-8 md:p-12">
          <header className="text-center mb-10">
            <h1 className="text-5xl pb-5 font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-green-400">
              Enzi - TinyLink
            </h1>
            <p className="mt-3 text-slate-400 text-lg">
              Shorten your long URLs into memorable links.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="longUrl" className="block text-sm font-medium text-slate-300 mb-1">
                Enter your long URL
              </label>
              <input
                type="url"
                id="longUrl"
                name="longUrl"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://www.example.com/very/long/url/to/shorten"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-400 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Shorten URL'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}

          {shortUrl && !error && (
            <div className="mt-10 p-6 bg-slate-700/70 rounded-lg shadow-inner">
              <h2 className="text-xl font-semibold text-slate-200 mb-3">Your shortened URL:</h2>
              <div className="flex items-center space-x-3 bg-slate-800 p-3 rounded-md">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 break-all flex-grow"
                >
                  {shortUrl}
                </a>
                <button
                  onClick={handleCopyToClipboard}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    copied
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-slate-500 text-sm">
          {/* <p>Built with Next.js & Tailwind CSS. Inspired by System Design principles.</p> */}
          {/* START: Added Enzi.ai attribution */}
          <p>
            Lovingly crafted by{' '}
            <a
              href="https://enzi.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 hover:underline"
            >
              Enzi.ai
            </a>
            .
          </p>
          {/* END: Added Enzi.ai attribution */}
          <p className="mt-2">© {new Date().getFullYear()} TinyLink. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}