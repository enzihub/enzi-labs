'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-100">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <h1 className="text-4xl font-bold mb-12 text-center text-slate-900">Note Trainer</h1>
        
        <div className="flex flex-col items-center gap-8">
          <p className="text-lg text-center max-w-lg mb-4">
            Practice identifying notes on the musical staff. Select which mode you want to train with.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
            <Link 
              href="/treble" 
              className="bg-blue-600 text-white px-8 py-6 rounded-lg text-xl font-semibold flex-1 text-center hover:bg-blue-700 transition-colors max-w-xs"
            >
              Treble Clef Trainer
            </Link>
            
            <Link 
              href="/bass" 
              className="bg-green-600 text-white px-8 py-6 rounded-lg text-xl font-semibold flex-1 text-center hover:bg-green-700 transition-colors max-w-xs"
            >
              Bass Clef Trainer
            </Link>
          </div>
          
          <div className="mt-8 w-full flex justify-center">
            <Link 
              href="/songs" 
              className="bg-purple-600 text-white px-8 py-6 rounded-lg text-xl font-semibold text-center hover:bg-purple-700 transition-colors max-w-md w-full"
            >
              Song Sight Reading Practice
            </Link>
          </div>
          
          <p className="text-md text-center text-gray-600 max-w-lg mt-2">
            Practice sight reading with real songs like &quot;Twinkle Twinkle Little Star&quot;
          </p>
          
          <div className="text-xs text-gray-400 font-light mt-10">
            Made with love by <a href="https://enzi.ai" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 transition-colors">enzi.ai</a> ❤️
          </div>
        </div>
      </div>
    </main>
  );
}