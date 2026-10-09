'use client';

import { useEffect, useRef } from 'react';

// This component is a template for adding sound effects
// You can enable it later by uncommenting the audio code
const SoundEffects = ({ score, isCorrect, consecutiveCorrect = 0 }) => {
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);
  const streakSoundRef = useRef(null);
  const milestoneSoundRef = useRef(null);
  
  // Play sounds based on game events
  useEffect(() => {
    // Initialize audio elements on client side
    if (typeof window !== 'undefined' && !correctSoundRef.current) {
      // Create audio elements but don't actually load them yet
      // This is just a template - uncomment to enable actual sounds
      
      /*
      correctSoundRef.current = new Audio('/sounds/correct.mp3');
      incorrectSoundRef.current = new Audio('/sounds/incorrect.mp3');
      streakSoundRef.current = new Audio('/sounds/streak.mp3');
      milestoneSoundRef.current = new Audio('/sounds/milestone.mp3');
      
      // Set volume levels
      correctSoundRef.current.volume = 0.4;
      incorrectSoundRef.current.volume = 0.3;
      streakSoundRef.current.volume = 0.5;
      milestoneSoundRef.current.volume = 0.6;
      */
    }
  }, []);
  
  // Play correct/incorrect sounds
  useEffect(() => {
    if (isCorrect === null || typeof window === 'undefined') return;
    
    if (isCorrect) {
      // Play correct sound
      // correctSoundRef.current?.play().catch(e => console.log('Sound play prevented:', e));
      
      // Play streak sound if on a streak
      if (consecutiveCorrect > 0 && consecutiveCorrect % 5 === 0) {
        // streakSoundRef.current?.play().catch(e => console.log('Sound play prevented:', e));
      }
    } else {
      // Play incorrect sound
      // incorrectSoundRef.current?.play().catch(e => console.log('Sound play prevented:', e));
    }
  }, [isCorrect, consecutiveCorrect]);
  
  // Play milestone sounds
  useEffect(() => {
    if (score > 0 && score % 10 === 0 && typeof window !== 'undefined') {
      // Play milestone sound
      // milestoneSoundRef.current?.play().catch(e => console.log('Sound play prevented:', e));
    }
  }, [score]);
  
  // This is a non-visible component, so it doesn't render anything
  return null;
};

export default SoundEffects;