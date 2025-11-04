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

  const cleanup = useCallback(() => {
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
    if (isSpeaking || isLoading) {
      cleanup();
      setIsSpeaking(false);
      setIsLoading(false);
    }

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
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('play', () => {
        setIsSpeaking(true);
        setIsLoading(false);
        options.onStart?.();
      });

      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        cleanup();
        options.onEnd?.();
      });

      audio.addEventListener('error', (e) => {
        setIsSpeaking(false);
        setIsLoading(false);
        cleanup();
        const error = new Error('Audio playback failed');
        options.onError?.(error);
      });

      await audio.play();
    } catch (error) {
      setIsSpeaking(false);
      setIsLoading(false);
      cleanup();
      options.onError?.(error as Error);
    }
  }, [isSpeaking, isLoading, options, cleanup]);

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
