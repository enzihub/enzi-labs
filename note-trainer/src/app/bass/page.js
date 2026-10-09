'use client';

import ClefTrainer from '../../components/ClefTrainer';
import Link from 'next/link';
import AnimatedBackground from '../../components/AnimatedBackground';
import { useState } from 'react';

export default function BassClefPage() {
  const [answerCorrect, setAnswerCorrect] = useState(null);
  const [score, setScore] = useState(0);
  
  // Callback function to receive updates from the ClefTrainer
  const onAnswerUpdate = (correct, newScore) => {
    setAnswerCorrect(correct);
    setScore(newScore);
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-100 relative">
      {/* Background particles at the page level */}
      <AnimatedBackground isCorrect={answerCorrect} score={score} />
      
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <div className="flex flex-col items-center">
          <ClefTrainer 
            clef="bass" 
            onAnswerUpdate={onAnswerUpdate}
          />
        </div>
        
        <div className="mt-8 text-center flex flex-col items-center">
          <div className="flex justify-center space-x-6 mb-3">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Back to Home
            </Link>
            <Link href="/treble" className="text-sm text-gray-600 hover:text-gray-900">
              Switch to Treble Clef
            </Link>
          </div>
          <div className="text-xs text-gray-400 font-light mt-2">
            Made with love by <a href="https://enzi.ai" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 transition-colors">enzi.ai</a> ❤️
          </div>
        </div>
      </div>
    </main>
  );
}