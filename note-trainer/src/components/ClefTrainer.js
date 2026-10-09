'use client';

import { useState, useEffect } from 'react';
import MusicStaff from './MusicStaff';
import NoteButtons from './NoteButtons';
import { Confetti, LoadingTransition, CelebrationStyles } from './Celebration';
import LoadingScreen from './LoadingScreen';
import AnimatedBackground from './AnimatedBackground';

// Define note maps for different clefs
const NOTE_KEY_BANKS = {
  treble: {
      C: ['c/4', 'c/5', 'c/6'], 
      D: ['d/4', 'd/5'],
      E: ['e/4', 'e/5'],
      F: ['f/4', 'f/5'],
      G: ['g/4', 'g/5'],
      A: ['a/4', 'a/5', 'a/3'],
      B: ['b/4', 'b/5', 'b/3'],
  },
  bass: {
      C: ['c/4', 'c/5', 'c/6'], 
      D: ['d/4', 'd/5'],
      E: ['e/4', 'e/5'],
      F: ['f/4', 'f/5'],
      G: ['g/4', 'g/5'],
      A: ['a/4', 'a/5', 'a/3'],
      B: ['b/4', 'b/5', 'b/3'],
  }
};

const ClefTrainer = ({ clef = 'treble', onAnswerUpdate = null }) => {
  // Game state
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [currentNoteLetter, setCurrentNoteLetter] = useState(null);
  const [currentNoteKey, setCurrentNoteKey] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [autoSwitchedToClef, setAutoSwitchedToClef] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLoadingTransition, setShowLoadingTransition] = useState(false);
  const [destinationClef, setDestinationClef] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  
  // Timing and logging
  const [startTime, setStartTime] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [showLog, setShowLog] = useState(false);
  
  // Load log entries from localStorage on component mount
  useEffect(() => {
    if (isClient) {
      try {
        const savedEntries = localStorage.getItem('noteTrainerLog');
        if (savedEntries) {
          setLogEntries(JSON.parse(savedEntries));
        }
      } catch (error) {
        console.error('Error loading log entries from localStorage:', error);
      }
    }
  }, [isClient]);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    // Allow time for hydration and initial rendering to complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // 1.2 second delay to ensure smooth loading
    
    return () => clearTimeout(timer);
  }, []);

  // Generate a random note for the given clef
  const generateRandomNote = () => {
    const noteBank = NOTE_KEY_BANKS[clef];
    const letters = Object.keys(noteBank);
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const keyList = noteBank[letter];
    const key = Array.isArray(keyList)
      ? keyList[Math.floor(Math.random() * keyList.length)]
      : keyList;
    
    console.log(`Generated Note: Letter=${letter}, Key=${key}, Clef=${clef}`);
    
    // For bass clef, also log what note it actually is
    if (clef === 'bass') {
      const bassClefNoteMap = {
        'C': 'E', 'D': 'F', 'E': 'G', 'F': 'A', 
        'G': 'B', 'A': 'C', 'B': 'D'
      };
      console.log(`Bass Clef: Note appearing at position ${letter} is actually ${bassClefNoteMap[letter]}`);
      console.log(`Press the ${bassClefNoteMap[letter]} button (not the ${letter} button)`);
    }
    
    return { letter, key };
  };

  // Start a new round
  const startNewRound = () => {
    const { letter, key } = generateRandomNote();
    setCurrentNoteLetter(letter);
    setCurrentNoteKey(key);
    setVisualFeedback(null);
    setConsecutiveFailures(0);
    setGameActive(true);
    
    // Start the timer for this round
    setStartTime(Date.now());
  };

  // For bass clef, we need to map the note positions correctly
  const getCorrectAnswer = (noteLetter, selectedClef) => {
    // In treble clef, the note letter is the same as what's expected
    if (selectedClef === 'treble') {
      return noteLetter;
    }
    
    // This function is incorrect and causing confusion. In bass clef:
    // When we see a note in the D position, it IS actually an F
    // When we see a note in the E position, it IS actually a G, etc.
    
    // The current bass clef mapping is actually correct for what note is showing:
    const bassClefNoteMap = {
      // Staff position -> Actual note name
      'C': 'E', // Note in C position is actually E
      'D': 'F', // Note in D position is actually F
      'E': 'G', // Note in E position is actually G
      'F': 'A', // Note in F position is actually A
      'G': 'B', // Note in G position is actually B
      'A': 'C', // Note in A position is actually C
      'B': 'D'  // Note in B position is actually D
    };
    
    // Log the actual note for this position on the bass clef
    console.log(`Bass Clef Note: Position ${noteLetter} is actually the note ${bassClefNoteMap[noteLetter]}`);
    console.log(`You should press the ${bassClefNoteMap[noteLetter]} button`);
    
    return bassClefNoteMap[noteLetter] || noteLetter;
  };

  // Handle note button clicks
  const handleNoteClick = (selectedNote) => {
    // Stop processing clicks if game is not active or if score has reached 50
    if (!gameActive || score >= 50 || showConfetti || showLoadingTransition) return;
    
    setAttempts(attempts + 1);
    
    // Log the current note information
    console.log(`Current Note Info: Letter=${currentNoteLetter}, Key=${currentNoteKey}, Clef=${clef}`);
    
    // Get the correct answer for the current clef
    const correctAnswer = getCorrectAnswer(currentNoteLetter, clef);
    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000; // Convert to seconds
    
    const isCorrect = selectedNote === correctAnswer;
    
    // Update the lastAnswerCorrect state for the animation
    setLastAnswerCorrect(isCorrect);
    
    // Call parent callback if provided
    if (onAnswerUpdate) {
      if (isCorrect) {
        onAnswerUpdate(isCorrect, Math.min(score + 1, 50));
      } else {
        onAnswerUpdate(isCorrect, score);
      }
    }
    
    if (isCorrect) {
      // Increment score, but don't exceed 50
      const newScore = Math.min(score + 1, 50);
      setScore(newScore);
      
      // Extract octave information from the note key
      const noteParts = currentNoteKey.split('/');
      const octave = noteParts[1];
      
      // Create a log entry for this note with octave information
      const logEntry = {
        id: Date.now(),
        note: correctAnswer,
        noteWithOctave: `${correctAnswer}${octave}`,
        attempts: consecutiveFailures + 1,
        timeElapsed: timeElapsed.toFixed(2),
        timestamp: new Date().toLocaleTimeString(),
        clef: clef // Track which clef this note was from
      };
      
      // Check if score is 50 and auto-switch clef if needed
      if (newScore === 50 && !autoSwitchedToClef) {
        if (clef === 'treble') {
          setAutoSwitchedToClef('bass');
          // Set destination for the loading transition
          setDestinationClef('/bass');
          // Show confetti and set visual feedback
          setVisualFeedback('correct');
          setShowConfetti(true);
          
          // Show loading transition after confetti begins
          setTimeout(() => {
            setShowLoadingTransition(true);
          }, 500);
        } else if (clef === 'bass') {
          setAutoSwitchedToClef('treble');
          // Set destination for the loading transition
          setDestinationClef('/treble');
          // Show confetti and set visual feedback
          setVisualFeedback('correct');
          setShowConfetti(true);
          
          // Show loading transition after confetti begins
          setTimeout(() => {
            setShowLoadingTransition(true);
          }, 500);
        }
      } else {
        // Set visual feedback for correct answer
        setVisualFeedback('correct');
      }
      
      // Add to log entries and save to localStorage
      setLogEntries(prev => {
        const updatedEntries = [logEntry, ...prev].slice(0, 500); // Keep last 500 entries
        try {
          localStorage.setItem('noteTrainerLog', JSON.stringify(updatedEntries));
        } catch (error) {
          console.error('Error saving log entries to localStorage:', error);
        }
        return updatedEntries;
      });
      
      // Set a longer delay for visual feedback to be visible
      setTimeout(() => {
        setVisualFeedback(null);
        startNewRound();
      }, 500);
    } else {
      // Increment consecutive failures counter
      setConsecutiveFailures(prev => prev + 1);
      
      // Set visual feedback for incorrect answer
      setVisualFeedback('incorrect');
      
      // Clear the visual feedback after a delay
      setTimeout(() => {
        setVisualFeedback(null);
      }, 600);
    }
    
    // Return whether the answer was correct for the visual feedback effect
    return isCorrect;
  };
  
  // Show hint after 3 consecutive failures
  const showHint = () => {
    const correctAnswer = getCorrectAnswer(currentNoteLetter, clef);
    // Instead of an alert, just briefly highlight the correct answer visually
    setVisualFeedback('hint');
    setTimeout(() => {
      setVisualFeedback(null);
    }, 500);
    
    // Show discreet hint below the staff
    const hintElement = document.getElementById('hintText');
    hintElement.textContent = `${correctAnswer}`;
    hintElement.style.display = 'block';
    hintElement.style.color = '#EAB308'; // Yellow-500 color to match border
    setTimeout(() => {
      document.getElementById('hintText').style.display = 'none';
    }, 500);
  };
  
  // Skip current note after many failed attempts
  const skipNote = () => {
    const correctAnswer = getCorrectAnswer(currentNoteLetter, clef);
    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000; // Convert to seconds
    
    // Extract octave information from the note key
    const noteParts = currentNoteKey.split('/');
    const octave = noteParts[1];
    
    // Add to log as a skipped note with octave information
    const logEntry = {
      id: Date.now(),
      note: correctAnswer,
      noteWithOctave: `${correctAnswer}${octave}`,
      attempts: consecutiveFailures + 1,
      timeElapsed: timeElapsed.toFixed(2),
      timestamp: new Date().toLocaleTimeString(),
      clef: clef, // Track which clef this note was from
      skipped: true
    };
    
    setLogEntries(prev => {
      const updatedEntries = [logEntry, ...prev].slice(0, 500); // Keep last 500 entries
      try {
        localStorage.setItem('noteTrainerLog', JSON.stringify(updatedEntries));
      } catch (error) {
        console.error('Error saving log entries to localStorage:', error);
      }
      return updatedEntries;
    });
    
    // Show visual hint instead of alert
    const hintElement = document.getElementById('hintText');
    hintElement.textContent = `${correctAnswer}`;
    hintElement.style.display = 'block';
    hintElement.style.color = '#EAB308'; // Yellow-500 color to match border
    
    // Show skip visual feedback
    setVisualFeedback('hint');
    
    // Wait a moment, then move to the next note
    setTimeout(() => {
      document.getElementById('hintText').style.display = 'none';
      setVisualFeedback(null);
      startNewRound();
    }, 500);
  };
  
  // Toggle showing the log
  const toggleLog = () => {
    setShowLog(!showLog);
  };
  
  // Calculate stats by note with octave
  const calculateNoteStats = (byOctave = false) => {
    const noteStats = {};
    
    logEntries.forEach(entry => {
      // Use either note with octave or just note depending on parameter
      const noteKey = byOctave ? entry.noteWithOctave : entry.note;
      
      if (!noteStats[noteKey]) {
        noteStats[noteKey] = {
          count: 0,
          totalTime: 0,
          totalAttempts: 0,
          skipped: 0
        };
      }
      
      noteStats[noteKey].count++;
      noteStats[noteKey].totalTime += parseFloat(entry.timeElapsed);
      noteStats[noteKey].totalAttempts += entry.attempts;
      
      if (entry.skipped) {
        noteStats[noteKey].skipped++;
      }
    });
    
    // Calculate averages
    Object.keys(noteStats).forEach(note => {
      const stats = noteStats[note];
      stats.avgTime = (stats.totalTime / stats.count).toFixed(2);
      stats.avgAttempts = (stats.totalAttempts / stats.count).toFixed(1);
    });
    
    return noteStats;
  };

  // Start the game only after client-side hydration is complete
  useEffect(() => {
    if (isClient) {
      startNewRound();
    }
  }, [isClient]);

  const clefTitle = clef === 'treble' ? 'Treble Clef' : 'Bass Clef';

  // State for cheat mode and visual feedback
  const [easyMode, setCheatMode] = useState(false);
  const [visualFeedback, setVisualFeedback] = useState(null);
  
  // Get hint indicator if needed (works for both clefs)
  const getHintIndicator = () => {
    if (!easyMode || !currentNoteLetter) return null;
    
    // For bass clef, we show the mapped note
    if (clef === 'bass') {
      const bassClefNoteMap = {
        'C': 'E', 'D': 'F', 'E': 'G', 'F': 'A', 
        'G': 'B', 'A': 'C', 'B': 'D'
      };
      
      return (
        <div className="text-center mb-1">
          <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs font-medium">
            <span className="text-blue-600">{bassClefNoteMap[currentNoteLetter]}</span>
          </span>
        </div>
      );
    }
    
    // For treble clef, we just show the actual note
    return (
      <div className="text-center mb-1">
        <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs font-medium">
          <span className="text-blue-600">{currentNoteLetter}</span>
        </span>
      </div>
    );
  };

  return (
    <LoadingScreen isLoading={isLoading || !isClient}>
      <div className="px-4 pt-2 pb-5 bg-white rounded-lg shadow-md relative overflow-hidden">
        {/* Add confetti and loading transition components */}
        <Confetti active={showConfetti} />
        <LoadingTransition 
          isActive={showLoadingTransition} 
          destination={destinationClef} 
        />
        <CelebrationStyles />
      
      {/* Removed the global flash for more subtle feedback */}
      <div className="flex justify-between items-center mb-2">
        {/* <h2 className="text-2xl font-semibold text-slate-900">{clefTitle} Trainer</h2> */}
        <div className="text-right flex items-center gap-3">
          {/* Easy mode toggle - now visible for both clefs and smaller */}
          <button 
            onClick={() => setCheatMode(!easyMode)} 
            className={`text-xs px-1.5 py-0.5 rounded text-xs ${easyMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
            style={{ fontSize: '0.7rem' }}
          >
            {easyMode ? '👁️ Hints On' : '👁️ Hints Off'}
          </button>
          <p className="text-lg font-medium">Score: {score}/{attempts}</p>
        </div>
      </div>
      
      {/* Main content in side-by-side layout */}
      <div className="flex flex-col md:flex-row gap-0">
        {/* Left side - Note trainer */}
        <div className="flex-1">
          <div className="mb-3">
            {isClient && currentNoteKey && (
              <div className="flex justify-center relative">
                <MusicStaff 
                  clef={clef} 
                  currentNote={currentNoteKey} 
                  width={400} 
                  height={150} 
                />
                
                {/* Visual feedback - border only, but more noticeable */}
                {visualFeedback && (
                  <div className={`absolute inset-0 rounded-lg border-4 ${
                    visualFeedback === 'correct' ? 'border-green-500' : 
                    visualFeedback === 'incorrect' ? 'border-red-500' : 
                    visualFeedback === 'hint' ? 'border-yellow-500' : ''}
                  `}></div>
                )}
                
                {/* Hint text that appears when hint is shown */}
                <div id="hintText" className="absolute bottom-4 left-0 right-0 text-center font-bold text-2xl" style={{display: 'none'}}></div>
                
                {/* Disable overlay when score reaches 50 */}
                {score >= 50 && !showConfetti && (
                  <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center z-10">
                    <div className="text-xl font-bold text-gray-700">Perfect 50!</div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Hint indicator for both clefs - placed just above the note buttons */}
          {getHintIndicator()}
          
          {isClient && <NoteButtons onNoteClick={handleNoteClick} clef={clef} disabled={score >= 50} />}
          
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
        {/* <div className="md:w-1/2 flex-shrink-0">
          <div className="border border-gray-200 rounded-lg shadow-sm p-4 h-96 overflow-auto bg-white">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-3 z-10 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Activity Log</h3>
              <a 
                href="/cheatsheet" 
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors shadow-sm"
              >
                View Detailed Stats
              </a>
            </div>
            
            {logEntries.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 text-center">No stats recorded yet. Answer some notes to see your timing.</p>
              </div>
            ) : (
              <table className="w-full text-sm table-auto">
                <thead className="sticky top-14 bg-white z-10">
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 text-gray-700 border-b border-gray-200 rounded-tl-md">Note</th>
                    <th className="text-left py-2 px-3 text-gray-700 border-b border-gray-200 rounded-tr-md">Time (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {logEntries.map((entry, index) => (
                    <tr 
                      key={entry.id} 
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="py-2 px-3 font-medium">{entry.noteWithOctave || entry.note}</td>
                      <td className="py-2 px-3">{entry.timeElapsed}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div> */}
      </div>
    </div>
    </LoadingScreen>
  );
};

export default ClefTrainer;