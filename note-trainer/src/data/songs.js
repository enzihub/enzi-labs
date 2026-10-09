'use client';

// Basic song library with note sequences
// Format: Each song has a title, clef, and an array of notes with their duration
// Each note has a note letter, octave, and position in VexFlow format

export const SONGS = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    clef: 'treble',
    notes: [
      { letter: 'C', key: 'c/4', duration: '4' }, // Twink-
      { letter: 'C', key: 'c/4', duration: '4' }, // -le
      { letter: 'G', key: 'g/4', duration: '4' }, // twink-
      { letter: 'G', key: 'g/4', duration: '4' }, // -le
      { letter: 'A', key: 'a/4', duration: '4' }, // lit-
      { letter: 'A', key: 'a/4', duration: '4' }, // -tle
      { letter: 'G', key: 'g/4', duration: '2' }, // star
      { letter: 'F', key: 'f/4', duration: '4' }, // How
      { letter: 'F', key: 'f/4', duration: '4' }, // I
      { letter: 'E', key: 'e/4', duration: '4' }, // won-
      { letter: 'E', key: 'e/4', duration: '4' }, // -der
      { letter: 'D', key: 'd/4', duration: '4' }, // what
      { letter: 'D', key: 'd/4', duration: '4' }, // you
      { letter: 'C', key: 'c/4', duration: '2' }, // are
      { letter: 'G', key: 'g/4', duration: '4' }, // Up
      { letter: 'G', key: 'g/4', duration: '4' }, // a-
      { letter: 'F', key: 'f/4', duration: '4' }, // -bove
      { letter: 'F', key: 'f/4', duration: '4' }, // the
      { letter: 'E', key: 'e/4', duration: '4' }, // world
      { letter: 'E', key: 'e/4', duration: '4' }, // so
      { letter: 'D', key: 'd/4', duration: '2' }, // high
    ]
  },
  {
    id: 'mary',
    title: 'Mary Had a Little Lamb',
    clef: 'treble',
    notes: [
      { letter: 'E', key: 'e/4', duration: '4' }, // Ma-
      { letter: 'D', key: 'd/4', duration: '4' }, // -ry
      { letter: 'C', key: 'c/4', duration: '4' }, // had
      { letter: 'D', key: 'd/4', duration: '4' }, // a
      { letter: 'E', key: 'e/4', duration: '4' }, // lit-
      { letter: 'E', key: 'e/4', duration: '4' }, // -tle
      { letter: 'E', key: 'e/4', duration: '2' }, // lamb
      { letter: 'D', key: 'd/4', duration: '4' }, // lit-
      { letter: 'D', key: 'd/4', duration: '4' }, // -tle
      { letter: 'D', key: 'd/4', duration: '2' }, // lamb
      { letter: 'E', key: 'e/4', duration: '4' }, // lit-
      { letter: 'E', key: 'e/4', duration: '4' }, // -tle
      { letter: 'E', key: 'e/4', duration: '2' }, // lamb
      { letter: 'E', key: 'e/4', duration: '4' }, // Ma-
      { letter: 'D', key: 'd/4', duration: '4' }, // -ry
      { letter: 'C', key: 'c/4', duration: '4' }, // had
      { letter: 'D', key: 'd/4', duration: '4' }, // a
      { letter: 'E', key: 'e/4', duration: '4' }, // lit-
      { letter: 'E', key: 'e/4', duration: '4' }, // -tle
      { letter: 'E', key: 'e/4', duration: '4' }, // lamb
      { letter: 'E', key: 'e/4', duration: '4' }, // its
      { letter: 'D', key: 'd/4', duration: '4' }, // fleece
      { letter: 'D', key: 'd/4', duration: '4' }, // was
      { letter: 'E', key: 'e/4', duration: '4' }, // white
      { letter: 'D', key: 'd/4', duration: '4' }, // as
      { letter: 'C', key: 'c/4', duration: '2' }, // snow
    ]
  },
  {
    id: 'jingle',
    title: 'Jingle Bells (First Line)',
    clef: 'treble',
    notes: [
      { letter: 'E', key: 'e/4', duration: '4' }, // Jin-
      { letter: 'E', key: 'e/4', duration: '4' }, // -gle
      { letter: 'E', key: 'e/4', duration: '2' }, // bells
      { letter: 'E', key: 'e/4', duration: '4' }, // jin-
      { letter: 'E', key: 'e/4', duration: '4' }, // -gle
      { letter: 'E', key: 'e/4', duration: '2' }, // bells
      { letter: 'E', key: 'e/4', duration: '4' }, // jin-
      { letter: 'G', key: 'g/4', duration: '4' }, // -gle
      { letter: 'C', key: 'c/4', duration: '4' }, // all
      { letter: 'D', key: 'd/4', duration: '4' }, // the
      { letter: 'E', key: 'e/4', duration: '1' }, // way
    ]
  }
];

// For bass clef versions
export const BASS_CLEF_SONGS = [
  {
    id: 'twinkle-bass',
    title: 'Twinkle Twinkle Little Star (Bass Clef)',
    clef: 'bass',
    notes: [
      { letter: 'C', key: 'c/3', duration: '4' },
      { letter: 'C', key: 'c/3', duration: '4' },
      { letter: 'G', key: 'g/3', duration: '4' },
      { letter: 'G', key: 'g/3', duration: '4' },
      { letter: 'A', key: 'a/3', duration: '4' },
      { letter: 'A', key: 'a/3', duration: '4' },
      { letter: 'G', key: 'g/3', duration: '2' },
      { letter: 'F', key: 'f/3', duration: '4' },
      { letter: 'F', key: 'f/3', duration: '4' },
      { letter: 'E', key: 'e/3', duration: '4' },
      { letter: 'E', key: 'e/3', duration: '4' },
      { letter: 'D', key: 'd/3', duration: '4' },
      { letter: 'D', key: 'd/3', duration: '4' },
      { letter: 'C', key: 'c/3', duration: '2' },
    ]
  }
];

// Helper function to get all songs
export const getAllSongs = () => {
  return [...SONGS, ...BASS_CLEF_SONGS];
};

// Helper function to get songs for a specific clef
export const getSongsByClef = (clef) => {
  if (clef === 'treble') {
    return SONGS;
  } else if (clef === 'bass') {
    return BASS_CLEF_SONGS;
  }
  return [];
};

// Helper function to get a specific song by ID
export const getSongById = (songId) => {
  const allSongs = getAllSongs();
  return allSongs.find(song => song.id === songId);
};