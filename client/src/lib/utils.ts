import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdownForSpeech(text: string): string {
  return text
    // Convert specific analytical labels to natural speech cues
    .replace(/\[GROWTH_OPPORTUNITY\]/gi, 'Insight: ')
    .replace(/\[TRIGGER\]/gi, 'Context, Trigger: ')
    .replace(/\[ACTION\]/gi, 'Action taken: ')
    .replace(/\[CONSEQUENCE\]/gi, 'Consequence: ')
    .replace(/\[APPRAISAL\]/gi, 'Your appraisal: ')
    .replace(/\[EMOTIONAL RESPONSE\]/gi, 'Emotional response: ')
    .replace(/\[REGULATION ATTEMPT\]/gi, 'Regulation attempt: ')
    
    // Remove other parenthetical/bracketed analytical labels that might be noisy
    .replace(/\s*\((trigger|action|consequence|appraisal|emotional response|regulation attempt|response|regulation)\)/gi, '')
    .replace(/\s*\[(RESPONSE|REGULATION)\]/gi, '')

    // Handle nested markdown by repeating the stripping process or using more robust regex
    // Remove bold/italic (handles some nesting by doing it in order)
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
    
    // Remove strikethrough
    .replace(/~~(.+?)~~/g, '$1')
    
    // Remove inline code backticks
    .replace(/`(.+?)`/g, '$1')
    
    // Remove links but keep text: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    
    // Remove headers but add a pause (period)
    .replace(/#{1,6}\s+(.+?)(\n|$)/g, '$1. ')
    
    // Handle lists: add a period and space after each item to avoid run-on sentences
    .replace(/^\s*[-*+]\s+(.+?)(\n|$)/gm, '$1. ')
    .replace(/^\s*\d+\.\s+(.+?)(\n|$)/gm, '$1. ')
    
    // Clean up multiple spaces and newlines for smoother TTS
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
