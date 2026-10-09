'use client';

import { useState, useEffect } from 'react';
import MusicStaff from './MusicStaff';
import NoteButtons from './NoteButtons';
import { getSongById } from '../data/songs';

const SongTrainer = ({ songId, onSelectSong }) => {
  // Get song data
  const song = getSongById(songId);
  
  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [gameActive, setGameActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Timing and logging
  const [startTime, setStartTime] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [showLog, setShowLog] = useState(false);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Current note information
  const getCurrentNote = () => {
    if (!song || !song.notes || song.notes.length === 0 || currentIndex >= song.notes.length) {
      return null;
    }
    return song.notes[currentIndex];
  };
  
  const currentNote = getCurrentNote();
  
  // For bass clef, we need to map the note positions correctly
  const getCorrectAnswer = (noteLetter, selectedClef) => {
    // In treble clef, the note letter is the same as what's expected
    if (selectedClef === 'treble') {
      return noteLetter;
    }
    
    // In bass clef, we need to shift the note letter to account for VexFlow rendering issues
    // This mapping shifts note letters to get the correct answer for bass clef
    const bassClefMapping = {
      // What's displayed on the staff -> What note it actually is
      'C': 'E', // Shift up by 2 notes (C -> E)
      'D': 'F', // Shift up by 2 notes (D -> F)
      'E': 'G', // Shift up by 2 notes (E -> G)
      'F': 'A', // Shift up by 2 notes (F -> A)
      'G': 'B', // Shift up by 2 notes (G -> B)
      'A': 'C', // Shift up by 2 notes (A -> C)
      'B': 'D'  // Shift up by 2 notes (B -> D)
    };
    
    return bassClefMapping[noteLetter] || noteLetter;
  };
  
  // Start a new song
  useEffect(() => {
    if (isClient && song) {
      setCurrentIndex(0);
      setScore(0);
      setAttempts(0);
      setConsecutiveFailures(0);
      setFeedback('');
      setGameActive(true);
      setStartTime(Date.now());
    }
  }, [isClient, song]);
  
  // Handle note button clicks
  const handleNoteClick = (selectedNote) => {
    if (!gameActive || !currentNote) return;
    
    setAttempts(attempts + 1);
    
    // Get the correct answer for the current clef
    const correctAnswer = getCorrectAnswer(currentNote.letter, song.clef);
    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000; // Convert to seconds
    
    const isCorrect = selectedNote === correctAnswer;
    
    if (isCorrect) {
      // Increment score
      const newScore = score + 1;
      setScore(newScore);
      
      // Extract octave information from the note key
      const noteParts = currentNote.key.split('/');
      const octave = noteParts[1];
      
      // Create a log entry for this note with octave information
      const logEntry = {
        id: Date.now(),
        note: correctAnswer,
        noteWithOctave: `${correctAnswer}${octave}`,
        attempts: consecutiveFailures + 1,
        timeElapsed: timeElapsed.toFixed(2),
        timestamp: new Date().toLocaleTimeString(),
        clef: song.clef, // Track which clef this note was from
        songId: song.id,
        songTitle: song.title,
        noteIndex: currentIndex
      };
      
      setFeedback(`✅ Correct! (${timeElapsed.toFixed(2)}s)`);
      
      // Add to log entries and save to localStorage
      setLogEntries(prev => {
        const updatedEntries = [logEntry, ...prev].slice(0, 500); // Keep last 500 entries
        try {
          localStorage.setItem('songTrainerLog', JSON.stringify(updatedEntries));
        } catch (error) {
          console.error('Error saving log entries to localStorage:', error);
        }
        return updatedEntries;
      });
      
      // Move to the next note if available
      if (currentIndex < song.notes.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setConsecutiveFailures(0);
        setStartTime(Date.now());
      } else {
        // Song is complete
        setFeedback(`🎉 Congratulations! You completed "${song.title}"!`);
        setGameActive(false);
      }
    } else {
      // Increment consecutive failures counter
      setConsecutiveFailures(prev => prev + 1);
      
      // Only show the error feedback but don't move to next note
      setFeedback(`❌ Try again`);
    }
    
    // Return whether the answer was correct for the visual feedback effect
    return isCorrect;
  };
  
  // Show hint after 3 consecutive failures
  const showHint = () => {
    if (!currentNote) return;
    
    const correctAnswer = getCorrectAnswer(currentNote.letter, song.clef);
    setFeedback(`Hint: The correct note is ${correctAnswer}`);
  };
  
  // Skip current note after many failed attempts
  const skipNote = () => {
    if (!currentNote) return;
    
    const correctAnswer = getCorrectAnswer(currentNote.letter, song.clef);
    setFeedback(`Skipped. The correct note was ${correctAnswer}`);
    
    // Move to the next note if available
    if (currentIndex < song.notes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setConsecutiveFailures(0);
      setStartTime(Date.now());
    } else {
      // Song is complete
      setFeedback(`Song complete!`);
      setGameActive(false);
    }
  };
  
  // Navigate through the song
  const navigateToNote = (index) => {
    if (index >= 0 && index < song.notes.length) {
      setCurrentIndex(index);
      setConsecutiveFailures(0);
      setStartTime(Date.now());
      setFeedback('');
    }
  };
  
  // Calculate progress
  const progress = song ? Math.round((currentIndex / song.notes.length) * 100) : 0;
  
  // Return to song selection
  const handleBackToSongs = () => {
    if (typeof onSelectSong === 'function') {
      onSelectSong(null);
    }
  };
  
  if (!song) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-slate-900">Song not found</h2>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={handleBackToSongs}
        >
          Back to Song List
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">{song.title}</h2>
        <div className="text-right">
          <p className="text-lg font-medium">
            Progress: {currentIndex + 1}/{song.notes.length} notes 
            <span className="ml-2 font-bold">{feedback}</span>
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
        <div 
          className="bg-blue-500 h-4 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Main content in side-by-side layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - Song trainer */}
        <div className="flex-1">
          <div className="mb-6">
            {isClient && currentNote && (
              <MusicStaff 
                clef={song.clef} 
                currentNote={currentNote.key} 
                width={300} 
                height={150} 
              />
            )}
          </div>
          
          {isClient && <NoteButtons onNoteClick={handleNoteClick} clef={song.clef} />}
          
          {/* Navigation controls */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => navigateToNote(currentIndex - 1)}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded transition-colors ${
                currentIndex === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              Previous Note
            </button>
            
            <button
              onClick={handleBackToSongs}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Back to Songs
            </button>
            
            <button
              onClick={() => navigateToNote(currentIndex + 1)}
              disabled={currentIndex >= song.notes.length - 1 || !gameActive}
              className={`px-4 py-2 rounded transition-colors ${
                currentIndex >= song.notes.length - 1 || !gameActive
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              Skip to Next
            </button>
          </div>
          
          {/* Show help buttons after consecutive failures */}
          {consecutiveFailures >= 3 && (
            <div className="mt-4 text-center flex justify-center gap-3">
              <button 
                onClick={showHint}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Show Hint
              </button>
              
              {consecutiveFailures >= 5 && (
                <button 
                  onClick={skipNote}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Skip Note
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Right side - Stats panel */}
        <div className="md:w-1/2 flex-shrink-0">
          <div className="border border-gray-200 rounded p-4 h-96 overflow-auto">
            <div className="flex justify-between items-center mb-3 sticky top-0 bg-white pb-2 z-10">
              <h3 className="text-lg font-semibold">Song Progress</h3>
            </div>
            
            <div className="space-y-2">
              {song.notes.map((note, index) => {
                // Determine status class
                let statusClass = "bg-gray-100"; // Upcoming notes
                if (index === currentIndex) {
                  statusClass = "bg-blue-100 border-l-4 border-blue-500"; // Current note
                } else if (index < currentIndex) {
                  statusClass = "bg-green-100"; // Completed notes
                }
                
                return (
                  <div 
                    key={index} 
                    className={`p-2 rounded flex justify-between items-center ${statusClass}`}
                    onClick={() => navigateToNote(index)}
                  >
                    <span className="font-medium">Note {index + 1}: {note.letter}</span>
                    <span className="text-sm text-gray-600">{note.key}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongTrainer;