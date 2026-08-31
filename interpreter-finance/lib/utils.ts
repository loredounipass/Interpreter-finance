import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'


// MERGES CLASS NAMES USING TAILWIND CSS CONFLICT RESOLUTION
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
