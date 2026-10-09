'use client';

import { useState, useEffect, useCallback } from 'react';

const PIANO_LAYOUT = {
  whiteKeys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  blackKeys: {
    'C': 'C#',
    'D': 'D#',
    'F': 'F#',
    'G': 'G#',
    'A': 'A#',
  }
};

const CLEF_NOTE_ORDERS = {
  treble: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  bass: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] 
};

const KEY_SHORTCUTS = {
  'C': '1',
  'D': '2',
  'E': '3',
  'F': '4',
  'G': '5',
  'A': 'w',
  'B': 'e'
};

const BLACK_KEY_POSITIONS = {
  'C#': 0.75,
  'D#': 1.75,
  'F#': 3.75,
  'G#': 4.75,
  'A#': 5.75,
};

const NoteButtons = ({ onNoteClick, clef = 'treble', disabled = false }) => {
  const [feedbackState, setFeedbackState] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState(null);
  
  const handleClick = useCallback((note) => {
    // If buttons are disabled, don't process clicks
    if (disabled) return;
    
    setFeedbackNote(note);
    
    if (onNoteClick) {
      const result = onNoteClick(note);
      if (result === true) {
        setFeedbackState('correct');
      } else if (result === false) {
        setFeedbackState('incorrect');
      }
      setTimeout(() => {
        setFeedbackState(null);
        setFeedbackNote(null);
      }, 300);
    }
  }, [onNoteClick, disabled]);

  const noteOrder = CLEF_NOTE_ORDERS[clef];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyPress = (event) => {
      // If buttons are disabled, don't process keyboard shortcuts
      if (disabled) return;
      
      const key = event.key.toLowerCase();
      if (key === '1') handleClick(noteOrder[0]);
      else if (key === '2') handleClick(noteOrder[1]);
      else if (key === '3') handleClick(noteOrder[2]);
      else if (key === '4') handleClick(noteOrder[3]);
      else if (key === '5') handleClick(noteOrder[4]);
      else if (key === 'w') handleClick(noteOrder[5]);
      else if (key === 'e') handleClick(noteOrder[6]);
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleClick, noteOrder, disabled]);

  const renderWhiteKey = (note) => {
    let keyStyle = '';
    let hoverStyle = '';
    let activeStyle = '';
    let labelStyle = 'text-white';
    let shortcutStyle = '';
    
    // Set colors based on the note mapping provided
    if (note === 'C') {
      // Red - #FF3B30
      keyStyle = 'border-red-500';
      hoverStyle = 'hover:bg-red-400 active:bg-red-500';
      shortcutStyle = 'text-red-300';
      labelStyle = 'text-white';
      // Set direct background color with the exact hex
      activeStyle = 'bg-[#FF3B30]';
    } else if (note === 'D') {
      // Purple - #AF52DE
      keyStyle = 'border-purple-500';
      hoverStyle = 'hover:bg-purple-400 active:bg-purple-500';
      shortcutStyle = 'text-purple-300';
      labelStyle = 'text-white';
      activeStyle = 'bg-[#AF52DE]';
    } else if (note === 'E') {
      // Gold - #FFD60A
      keyStyle = 'border-yellow-500';
      hoverStyle = 'hover:bg-yellow-400 active:bg-yellow-500';
      shortcutStyle = 'text-yellow-700';
      labelStyle = 'text-yellow-900';
      activeStyle = 'bg-[#FFD60A]';
    } else if (note === 'F') {
      // Blue - #007AFF
      keyStyle = 'border-blue-500';
      hoverStyle = 'hover:bg-blue-400 active:bg-blue-500';
      shortcutStyle = 'text-blue-300';
      labelStyle = 'text-white';
      activeStyle = 'bg-[#007AFF]';
    } else if (note === 'G') {
      // Green - #34C759
      keyStyle = 'border-green-500';
      hoverStyle = 'hover:bg-green-400 active:bg-green-500';
      shortcutStyle = 'text-green-300';
      labelStyle = 'text-white';
      activeStyle = 'bg-[#34C759]';
    } else if (note === 'A') {
      // Orange - #FF9500
      keyStyle = 'border-orange-500';
      hoverStyle = 'hover:bg-orange-400 active:bg-orange-500';
      shortcutStyle = 'text-orange-300';
      labelStyle = 'text-white';
      activeStyle = 'bg-[#FF9500]';
    } else if (note === 'B') {
      // Grey - #8E8E93
      keyStyle = 'border-gray-500';
      hoverStyle = 'hover:bg-gray-400 active:bg-gray-500';
      shortcutStyle = 'text-gray-300';
      labelStyle = 'text-white';
      activeStyle = 'bg-[#8E8E93]';
    }
    
    // Override colors for feedback states
    if (feedbackNote === note && feedbackState === 'correct') {
      keyStyle = 'bg-green-500 border-green-600';
      hoverStyle = 'hover:bg-green-600 active:bg-green-700';
      shortcutStyle = 'text-green-200';
    } else if (feedbackNote === note && feedbackState === 'incorrect') {
      keyStyle = 'bg-red-500 border-red-600';
      hoverStyle = 'hover:bg-red-600 active:bg-red-700';
      shortcutStyle = 'text-red-200';
    }

    return (
      <div 
        key={note}
        className={`relative flex flex-col items-center justify-end w-14 h-36 rounded-b-md ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} border shadow-md transition-all duration-150 ${activeStyle} ${keyStyle} ${disabled ? '' : hoverStyle}`}
        onClick={() => handleClick(note)}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-15">
          <span className={`text-xl font-bold ${labelStyle}`}>{note}</span>
        </div>
        <span className={`text-xs mb-3 ${shortcutStyle}`}>{KEY_SHORTCUTS[note]}</span>
      </div>
    );
  };

  const renderBlackKey = (note) => {
    const leftPercentage = (BLACK_KEY_POSITIONS[note] * 100) / PIANO_LAYOUT.whiteKeys.length;
    return (
      <div 
        key={note}
        className={`absolute top-0 w-8 h-20 bg-gray-800 rounded-b-md z-20 shadow-md ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-700 active:bg-gray-900 cursor-pointer'} transition-colors duration-150`}
        style={{ left: `${leftPercentage}%`, transform: 'translateX(-10%)' }}
        onClick={() => handleClick(note)}
      />
    );
  };

  return (
    <div className="w-full flex-col items-center">
      <div className="mt-6 relative flex justify-center">
        <div className="piano-container relative">
          <div className="flex relative mb-4">
            {PIANO_LAYOUT.whiteKeys.map((note) => renderWhiteKey(note))}
          </div>
          <div className="absolute top-0 left-0 w-full h-10 pointer-events-none">
            {Object.values(PIANO_LAYOUT.blackKeys).map(renderBlackKey)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteButtons;
