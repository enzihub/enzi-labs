'use client';

import { useState } from 'react';
import Link from 'next/link';
import SongTrainer from '../../components/SongTrainer';
import { getAllSongs, getSongsByClef } from '../../data/songs';

export default function SongsPage() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [filterClef, setFilterClef] = useState('all');
  
  // Get songs based on filter
  const songs = filterClef === 'all' ? getAllSongs() : getSongsByClef(filterClef);
  
  // Handle song selection
  const handleSelectSong = (songId) => {
    setSelectedSong(songId);
  };
  
  // If a song is selected, show the song trainer
  if (selectedSong) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-100">
        <div className="z-10 max-w-5xl w-full items-center justify-between">
          <SongTrainer songId={selectedSong} onSelectSong={handleSelectSong} />
        </div>
      </main>
    );
  }
  
  // Otherwise show the song selection UI
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-100">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Song Sight Reading</h1>
          <div className="flex gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
        
        {/* Filter controls */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setFilterClef('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                filterClef === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              All Songs
            </button>
            <button
              type="button"
              onClick={() => setFilterClef('treble')}
              className={`px-4 py-2 text-sm font-medium ${
                filterClef === 'treble'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              Treble Clef
            </button>
            <button
              type="button"
              onClick={() => setFilterClef('bass')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                filterClef === 'bass'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              Bass Clef
            </button>
          </div>
        </div>
        
        {/* Song selection grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {songs.map(song => (
            <div 
              key={song.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectSong(song.id)}
            >
              <h2 className="text-xl font-semibold mb-2">{song.title}</h2>
              <div className="flex justify-between items-center">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {song.clef === 'treble' ? 'Treble Clef' : 'Bass Clef'}
                </span>
                <span className="text-sm text-gray-600">
                  {song.notes.length} notes
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {songs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No songs found for the selected filter.</p>
          </div>
        )}
      </div>
    </main>
  );
}