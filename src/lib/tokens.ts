import { customAlphabet } from 'nanoid';

// URL-safe alphabet, no ambiguous characters (no 0/O, 1/l/I).
// 24 chars at this alphabet size = ~140 bits of entropy. Unguessable.
const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generate = customAlphabet(alphabet, 24);

export function generateRevealToken(): string {
  return generate();
}
