// lib/data.ts
export interface UrlEntry {
    id: number;
    shortCode: string;
    longUrl: string;
    createdAt: Date;
  }
  
  // In-memory store for demo purposes.
  // In a production environment, use a persistent database (e.g., PostgreSQL, MySQL, MongoDB, Redis).
  const urls: UrlEntry[] = [];
  let nextId = 1;
  
  export const addUrl = (longUrl: string, shortCode: string): UrlEntry => {
    const newEntry: UrlEntry = {
      id: nextId,
      shortCode,
      longUrl,
      createdAt: new Date(),
    };
    urls.push(newEntry);
    nextId++;
    return newEntry;
  };
  
  export const getUrlByShortCode = (shortCode: string): UrlEntry | undefined => {
    return urls.find(entry => entry.shortCode === shortCode);
  };
  
  export const getUrlByLongUrl = (longUrl: string): UrlEntry | undefined => {
    return urls.find(entry => entry.longUrl === longUrl);
  };
  
  export const getNextId = (): number => {
      return nextId;
  }