// lib/base62.ts
const CHARACTERS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = CHARACTERS.length; // 62

export const idToBase62 = (id: number): string => {
  if (id === 0) {
    return CHARACTERS[0];
  }

  let base62String = "";
  let currentId = id;

  while (currentId > 0) {
    base62String = CHARACTERS[currentId % BASE] + base62String;
    currentId = Math.floor(currentId / BASE);
  }
  return base62String;
};

// Not strictly needed for this implementation but good to have for completeness
export const base62ToId = (base62String: string): number => {
  let id = 0;
  for (let i = 0; i < base62String.length; i++) {
    id = id * BASE + CHARACTERS.indexOf(base62String[i]);
  }
  return id;
};