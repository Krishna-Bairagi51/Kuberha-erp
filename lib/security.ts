/**
 * Security utilities for password hashing and encryption
 */

/**
 * Hashes a password using SHA-256 algorithm
 * This provides client-side hashing before transmission over HTTPS
 * 
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hexadecimal hash string
 */
export async function hashPassword(password: string): Promise<string> {
  // Convert password to ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // Hash the password using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert ArrayBuffer to hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

