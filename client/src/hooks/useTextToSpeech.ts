import { useState, useCallback, useRef } from 'react';

interface TextToSpeechOptions {
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// Global audio context to enable auto-play after first user interaction
let globalAudioContext: AudioContext | null = null;
let globalAudioUnlocked = false;

export function useTextToSpeech(options: TextToSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const cleanup = useCallback(() => {
    // Abort any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (audioRef.current) {
      // Remove all event listeners before cleanup to prevent error events
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Function to unlock audio playback on first user interaction
  const unlockAudio = useCallback(async () => {
    if (globalAudioUnlocked) return true;
    
    try {
      // Create audio context if it doesn't exist
      if (!globalAudioContext) {
        globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume the context (requires user gesture)
      if (globalAudioContext.state === 'suspended') {
        await globalAudioContext.resume();
      }
      
      // Create a silent buffer and play it to unlock audio
      const buffer = globalAudioContext.createBuffer(1, 1, 22050);
      const source = globalAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(globalAudioContext.destination);
      source.start(0);
      
      globalAudioUnlocked = true;
      console.log('Audio unlocked successfully');
      return true;
    } catch (e) {
      console.error('Failed to unlock audio:', e);
      return false;
    }
  }, []);

  const speak = useCallback(async (text: string, userInitiated = false) => {
    if (!text) return;

    // If this is user-initiated, unlock audio first
    if (userInitiated) {
      await unlockAudio();
    }

    // Stop any existing playback before starting new one
    cleanup();
    setIsSpeaking(false);
    setIsLoading(false);

    // Create a new request ID and AbortController for this request
    const currentRequestId = ++requestIdRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: options.voiceId,
        }),
        signal: abortController.signal,
      });

      // Check if this request was cancelled
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API error:', response.status, errorText);
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      console.log('TTS audio blob received:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      // Check again if this request was cancelled after blob download
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      const handlePlay = () => {
        // Only update state if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setIsSpeaking(true);
          setIsLoading(false);
          options.onStart?.();
        }
      };

      const handleEnded = () => {
        if (currentRequestId === requestIdRef.current) {
          setIsSpeaking(false);
          // Remove event listeners before cleanup to prevent error events
          audio.removeEventListener('play', handlePlay);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          cleanup();
          options.onEnd?.();
        }
      };

      const handleError = (e: Event) => {
        if (currentRequestId === requestIdRef.current) {
          console.error('Audio playback error event:', e, 'Audio element:', audio, 'Error code:', audio.error?.code, 'Error message:', audio.error?.message);
          setIsSpeaking(false);
          setIsLoading(false);
          // Remove event listeners before cleanup
          audio.removeEventListener('play', handlePlay);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          cleanup();
          const error = new Error('Audio playback failed');
          options.onError?.(error);
        }
      };

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Final check before playing
      if (currentRequestId === requestIdRef.current) {
        try {
          console.log('Starting audio playback, audioUrl:', audioUrl);
          await audio.play();
          console.log('Audio playback started successfully');
        } catch (playError) {
          console.error('audio.play() failed (likely browser auto-play policy):', playError);
          // Browser blocked auto-play - call onError to trigger the banner
          setIsSpeaking(false);
          setIsLoading(false);
          cleanup();
          // Always call onError - the chat interface will decide how to handle it
          if (playError instanceof Error) {
            options.onError?.(playError);
          }
          return;
        }
      }
    } catch (error) {
      // Only report errors if this request is still current and wasn't aborted
      if (currentRequestId === requestIdRef.current && error instanceof Error && error.name !== 'AbortError') {
        console.error('TTS error in speak function:', error);
        setIsSpeaking(false);
        setIsLoading(false);
        cleanup();
        options.onError?.(error as Error);
      }
    }
  }, [options, cleanup, unlockAudio]);

  const stop = useCallback(() => {
    cleanup();
    setIsSpeaking(false);
    setIsLoading(false);
    options.onEnd?.();
  }, [cleanup, options]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    unlockAudio,
  };
}
