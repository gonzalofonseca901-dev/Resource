import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a client-side temporary id for optimistic creates while there is no
 * backend. Once Supabase is connected, ids come from the database instead.
 */
export function tempId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
