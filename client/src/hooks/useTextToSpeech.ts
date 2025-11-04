import { useState, useCallback, useRef } from 'react';

interface TextToSpeechOptions {
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

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
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

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

      audio.addEventListener('play', () => {
        // Only update state if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setIsSpeaking(true);
          setIsLoading(false);
          options.onStart?.();
        }
      });

      audio.addEventListener('ended', () => {
        if (currentRequestId === requestIdRef.current) {
          setIsSpeaking(false);
          cleanup();
          options.onEnd?.();
        }
      });

      audio.addEventListener('error', (e) => {
        if (currentRequestId === requestIdRef.current) {
          console.error('Audio playback error:', e, 'Audio element:', audio);
          setIsSpeaking(false);
          setIsLoading(false);
          cleanup();
          const error = new Error('Audio playback failed');
          options.onError?.(error);
        }
      });

      // Final check before playing
      if (currentRequestId === requestIdRef.current) {
        try {
          console.log('Starting audio playback, audioUrl:', audioUrl);
          await audio.play();
          console.log('Audio playback started successfully');
        } catch (playError) {
          console.error('audio.play() failed:', playError);
          throw playError;
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
  }, [options, cleanup]);

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
  };
}
