'use client';

import { useEffect, useState } from 'react';

const LoadingScreen = ({ isLoading = true, children }) => {
  const [showContent, setShowContent] = useState(!isLoading);
  const [fadeOut, setFadeOut] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // If this is the first time loading and we're loading
    if (initialLoad && isLoading) {
      setShowContent(false);
      setInitialLoad(false);
      return;
    }
    
    // When loading completes
    if (!isLoading && !showContent) {
      // Wait for a short delay before starting fade out animation
      const timer = setTimeout(() => {
        setFadeOut(true);
        
        // After animation is done, show actual content
        const contentTimer = setTimeout(() => {
          setShowContent(true);
        }, 400); // Match the duration of the fade-out animation
        
        return () => clearTimeout(contentTimer);
      }, 300); // Show the loading screen for at least 300ms
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, showContent, initialLoad]);

  if (showContent) {
    return children;
  }

  return (
    <div 
      className={`w-full h-full min-h-[350px] bg-white rounded-lg flex flex-col items-center justify-center transition-opacity duration-400 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-600">Loading notes...</p>
    </div>
  );
};

export default LoadingScreen;