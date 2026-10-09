'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const Confetti = ({ active, onComplete }) => {
  useEffect(() => {
    if (!active) return;

    // Create confetti elements
    const confettiContainer = document.getElementById('confetti-container');
    if (!confettiContainer) return;

    // Clear any existing confetti
    confettiContainer.innerHTML = '';
    
    // Create confetti pieces
    const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590'];
    
    // Create confetti elements
    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.className = 'confetti-piece';
      confetti.style.backgroundColor = color;
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.animationDelay = Math.random() * 5 + 's';
      
      confettiContainer.appendChild(confetti);
    }

    // Cleanup confetti after animation
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div 
      id="confetti-container" 
      className="fixed inset-0 pointer-events-none overflow-hidden z-50"
      style={{ perspective: '700px' }}
    />
  );
};

export const LoadingTransition = ({ destination, isActive }) => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isPreloading, setIsPreloading] = useState(false);
  
  // Create an invisible iframe to preload the next page
  useEffect(() => {
    if (!isActive) return;
    
    // Start with preloading the destination page
    setIsPreloading(true);
    
    // Create and load the iframe to preload the next page
    const preloadIframe = document.createElement('iframe');
    preloadIframe.style.width = '0';
    preloadIframe.style.height = '0';
    preloadIframe.style.position = 'absolute';
    preloadIframe.style.top = '-9999px';
    preloadIframe.style.left = '-9999px';
    preloadIframe.src = destination;
    document.body.appendChild(preloadIframe);
    
    preloadIframe.onload = () => {
      setIsPreloading(false);
    };
    
    return () => {
      if (preloadIframe && preloadIframe.parentNode) {
        preloadIframe.parentNode.removeChild(preloadIframe);
      }
    };
  }, [isActive, destination]);
  
  // Handle the transition animation and routing
  useEffect(() => {
    if (!isActive) return;

    const messages = [
      "Great job! You've mastered this clef!",
      "Loading next challenge...",
      "Switching to a new clef...",
      "Prepare for the next level!"
    ];
    
    // Start with first message
    setMessage(messages[0]);
    
    let currentMessage = 0;
    const messageInterval = setInterval(() => {
      currentMessage = (currentMessage + 1) % messages.length;
      setMessage(messages[currentMessage]);
    }, 1500);
    
    // Simulate loading progress, but slower at first to allow for preloading
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      // Slow down progress while preloading is happening
      const increment = isPreloading ? 1 : 3;
      currentProgress += increment;
      
      // Cap at 95% until preloading is done
      if (isPreloading && currentProgress > 60) {
        currentProgress = 60;
      } 
      
      setProgress(Math.min(currentProgress, 100));
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        
        // Navigate to destination after a short delay
        setTimeout(() => {
          router.push(destination);
        }, 300);
      }
    }, 35);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isActive, destination, router, isPreloading]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-40">
      <h2 className="text-2xl font-bold mb-8 text-slate-800">{message}</h2>
      <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
          style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}
        ></div>
      </div>
      <p className="mt-6 text-slate-600 font-medium">Score: 50/50</p>
    </div>
  );
};

// Adding global styles for confetti
export const CelebrationStyles = () => (
  <style jsx global>{`
    .confetti-piece {
      position: absolute;
      width: 10px;
      height: 20px;
      top: -20px;
      opacity: 0;
      transform: translateY(0) rotateX(0) rotateY(0);
      animation: confetti-fall 3s ease-in-out forwards;
    }
    
    @keyframes confetti-fall {
      0% {
        opacity: 1;
        transform: translateY(0) rotateX(0) rotateY(0);
      }
      100% {
        opacity: 0;
        transform: translateY(100vh) rotateX(360deg) rotateY(180deg);
      }
    }
  `}</style>
);