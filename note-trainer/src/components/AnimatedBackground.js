'use client';

import { useEffect, useState, useRef } from 'react';

const AnimatedBackground = ({ score = 0, isCorrect }) => {
  const [particles, setParticles] = useState([]);
  const [backgroundParticles, setBackgroundParticles] = useState([]);
  const containerRef = useRef(null);
  
  // Generate background particles on mount
  useEffect(() => {
    const generateParticles = () => {
      return Array.from({ length: 30 }, () => ({
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.15 + 0.05,
        speedX: (Math.random() - 0.5) * 0.1,
        speedY: (Math.random() - 0.5) * 0.1,
        color: getParticleColor(Math.random())
      }));
    };
    
    setBackgroundParticles(generateParticles());
    
    // Move background particles slowly
    const animateInterval = setInterval(() => {
      setBackgroundParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: (particle.x + particle.speedX + 100) % 100,
          y: (particle.y + particle.speedY + 100) % 100
        }))
      );
    }, 100);
    
    return () => clearInterval(animateInterval);
  }, []);
  
  // Effect for creating particles when correct answer is given
  useEffect(() => {
    if (isCorrect === true) {
      // Create sparkle particles on correct answer
      const newParticles = Array.from({ length: 15 }, () => ({
        id: Math.random().toString(36).substr(2, 9),
        x: 40 + Math.random() * 20, // Center the particles more
        y: 50 + Math.random() * 20,
        size: Math.random() * 5 + 2,
        duration: Math.random() * 1.5 + 1,
        delay: Math.random() * 0.3,
        color: getRandomColor()
      }));
      
      setParticles(prev => [...prev, ...newParticles]);
      
      // Remove particles after animation completes
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.includes(p)));
      }, 2500);
    }
  }, [isCorrect]);
  
  // Get random color for particles
  const getRandomColor = () => {
    const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#007AFF', '#AF52DE'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Get subtle color for background particles
  const getParticleColor = (value) => {
    if (value < 0.33) return '#d2d8e0';  // Light blue-gray
    if (value < 0.66) return '#e0e7f0';  // Very light blue
    return '#f0f3f8';                    // Almost white blue tint
  };
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
    >
      {/* Subtle background particles */}
      {backgroundParticles.map(particle => (
        <div 
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transition: 'left 1s linear, top 1s linear'
          }}
        />
      ))}
      
      {/* Sparkle particles for correct answers */}
      {particles.map(particle => (
        <div 
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: 0,
            animation: `sparkle ${particle.duration}s ease-out ${particle.delay}s forwards`
          }}
        />
      ))}
      
      {/* Background CSS animations and effects */}
      <style jsx>{`
        @keyframes sparkle {
          0% { transform: scale(0); opacity: 0; }
          40% { opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;