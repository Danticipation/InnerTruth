import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdownForSpeech(text: string): string {
  return text
    // Remove analytical format labels (trigger, action, consequence, etc.)
    .replace(/\s*\(trigger\)/gi, '')
    .replace(/\s*\(action\)/gi, '')
    .replace(/\s*\(consequence\)/gi, '')
    .replace(/\s*\(appraisal\)/gi, '')
    .replace(/\s*\(emotional response\)/gi, '')
    .replace(/\s*\(regulation attempt\)/gi, '')
    .replace(/\s*\(response\)/gi, '')
    .replace(/\s*\(regulation\)/gi, '')
    // Remove square bracket analytical labels [TRIGGER], [ACTION], etc.
    .replace(/\s*\[TRIGGER\]/gi, '')
    .replace(/\s*\[ACTION\]/gi, '')
    .replace(/\s*\[CONSEQUENCE\]/gi, '')
    .replace(/\s*\[APPRAISAL\]/gi, '')
    .replace(/\s*\[EMOTIONAL RESPONSE\]/gi, '')
    .replace(/\s*\[REGULATION ATTEMPT\]/gi, '')
    .replace(/\s*\[RESPONSE\]/gi, '')
    .replace(/\s*\[REGULATION\]/gi, '')
    // Remove bold/italic asterisks and underscores
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')  // Bold+italic
    .replace(/\*\*(.+?)\*\*/g, '$1')      // Bold
    .replace(/\*(.+?)\*/g, '$1')          // Italic
    .replace(/___(.+?)___/g, '$1')        // Bold+italic underscores
    .replace(/__(.+?)__/g, '$1')          // Bold underscores
    .replace(/_(.+?)_/g, '$1')            // Italic underscores
    // Remove strikethrough
    .replace(/~~(.+?)~~/g, '$1')
    // Remove inline code backticks
    .replace(/`(.+?)`/g, '$1')
    // Remove links but keep text
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '');
}
