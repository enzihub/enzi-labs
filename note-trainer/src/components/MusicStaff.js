'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';

const TREBLE_NOTE_MAP = {
  'C': { keys: ['c/4'], duration: 'w' },
  'D': { keys: ['d/4'], duration: 'w' },
  'E': { keys: ['e/4'], duration: 'w' },
  'F': { keys: ['f/4'], duration: 'w' },
  'G': { keys: ['g/4'], duration: 'w' },
  'A': { keys: ['a/4'], duration: 'w' },
  'B': { keys: ['b/4'], duration: 'w' }
};

const BASS_NOTE_MAP = {
  'C': { keys: ['c/3'], duration: 'w' },
  'D': { keys: ['d/3'], duration: 'w' },
  'E': { keys: ['e/3'], duration: 'w' },
  'F': { keys: ['f/3'], duration: 'w' },
  'G': { keys: ['g/2'], duration: 'w' },
  'A': { keys: ['a/3'], duration: 'w' },
  'B': { keys: ['b/3'], duration: 'w' }
};

const LETTER_CYCLE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
function shiftLetter(letter, offset) {
  const index = LETTER_CYCLE.indexOf(letter.toUpperCase());
  if (index === -1) return letter;
  const newIndex = (index + offset + 7) % 7;
  return LETTER_CYCLE[newIndex];
}

// Define notes to highlight in different colors based on note mapping
const getNoteColor = (noteKey, clefType) => {
  // Extract the note name (first character)
  const noteName = noteKey.charAt(0).toUpperCase();
  
  // Map each note to its specific color according to the provided mapping
  const noteColorMap = {
    'C': '#FF3B30', // Red
    'D': '#AF52DE', // Purple
    'E': '#FFD60A', // Gold
    'F': '#007AFF', // Blue
    'G': '#34C759', // Green
    'A': '#FF9500', // Orange
    'B': '#8E8E93'  // Grey
  };
  
  // For bass clef, we need to offset by +2 positions
  if (clefType === 'bass') {
    // Bass clef staff positions map to different actual notes
    const bassClefNoteMap = {
      'C': 'E', // Position C shows note E (+2)
      'D': 'F', // Position D shows note F (+2)
      'E': 'G', // Position E shows note G (+2)
      'F': 'A', // Position F shows note A (+2)
      'G': 'B', // Position G shows note B (+2)
      'A': 'C', // Position A shows note C (+2, wrapping)
      'B': 'D'  // Position B shows note D (+2, wrapping)
    };
    
    // Get the actual note that should be played for this position
    const actualNote = bassClefNoteMap[noteName] || noteName;
    return noteColorMap[actualNote] || null;
  }
  
  // For treble clef, just return the direct mapping
  return noteColorMap[noteName] || null;
};

const MusicStaff = ({ clef = 'treble', width = 300, height = 150, currentNote = null }) => {
  const containerRef = useRef(null);

  // Function to render a complete staff with the new note
  const renderNote = () => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    try {
      // Clear everything and start fresh
      containerRef.current.innerHTML = '';
      
      // Create a new renderer for each note change to prevent ghosting
      const renderer = new Renderer(
        containerRef.current,
        Renderer.Backends.SVG
      );

      renderer.resize(width, height);
      const context = renderer.getContext();
      context.setFillStyle('#000000');
      context.setStrokeStyle('#000000');
      
      // Set line width for better visibility
      context.setLineWidth(2);
      
      // Use moderate scaling for better visibility
      context.scale(1.2, 1.2);

      // Create and draw the stave - reduced margins for more compact look
      const staveX = 20; 
      const staveY = 2; // Reduced further to create more space at the bottom for lower notes
      const staveWidth = Math.floor((width - 50) / 1.2);
      const stave = new Stave(staveX, staveY, staveWidth);
      stave.addClef(clef);
      stave.setContext(context).draw();
      
      const voices = [];

      // Add note to staff if provided
      if (currentNote) {
        let noteKey, duration;

        if (currentNote.includes('/')) {
          let [noteName, octave] = currentNote.split('/');
          octave = parseInt(octave, 10);

          noteKey = `${noteName.toLowerCase()}/${octave}`;
          duration = 'w';  // Using whole note (no stem)
        } else {
          const noteMap = clef === 'treble' ? TREBLE_NOTE_MAP : BASS_NOTE_MAP;
          if (!noteMap[currentNote]) {
            console.error(`Note ${currentNote} not found in ${clef} map`);
            return;
          }
          noteKey = noteMap[currentNote].keys[0];
          duration = noteMap[currentNote].duration;
        }

        // Create a whole note (no stem)
        const userNote = new StaveNote({ 
          keys: [noteKey], 
          duration: 'w'
        });
        
        // Apply color based on note name and clef type
        const noteColor = getNoteColor(noteKey, clef);
        if (noteColor) {
          userNote.setStyle({ 
            fillStyle: noteColor, 
            strokeStyle: noteColor,
            // Increase stroke width for better visibility
            strokeWidth: 3
          });
        }
        
        const userVoice = new Voice({ num_beats: 4, beat_value: 4 });
        userVoice.addTickable(userNote);
        voices.push(userVoice);
      }

      // Format and draw voices
      if (voices.length > 0) {
        new Formatter().joinVoices(voices).format(voices, staveWidth * 0.6);
        voices.forEach(v => v.draw(context, stave));
      }
    } catch (error) {
      console.error('Error rendering staff with note:', error);
    }
  };

  // Effect to re-render just the note when it changes
  useEffect(() => {
    renderNote();
  }, [currentNote, clef, width, height, renderNote]);
  
  // Prepare empty element for rendering with minimal whitespace
  return (
    <div 
      ref={containerRef} 
      className="music-staff" 
      style={{ 
        margin: '0',
        padding: '0',
        lineHeight: '0', 
        overflow: 'hidden'
      }} 
    />
  );
};

export default MusicStaff;