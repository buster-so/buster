import { useCallback, useEffect, useRef, useState } from 'react';
import { openErrorNotification } from '@/context/BusterNotifications';
import { useBrowserDetection } from './useBrowserDetection';

// Type definitions for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Extend Window interface to include webkit speech recognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionReturn {
  onStartListening: () => void;
  onStopListening: () => void;
  listening: boolean;
  transcript: string;
  browserSupportsSpeechRecognition: boolean;
  error: string | null;
  hasPermission: boolean;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const finalTranscriptRef = useRef('');
  const { isEdge, isFirefox } = useBrowserDetection();

  // Check browser support - disable for Edge due to language support issues
  const browserSupportsSpeechRecognition =
    !isEdge &&
    !isFirefox &&
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // Check microphone permission
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return;
    }

    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setHasPermission(result.state === 'granted');

        // Listen for permission changes
        result.onchange = () => {
          setHasPermission(result.state === 'granted');
        };
      })
      .catch((err) => {
        console.error('Permission API error:', err);
      });
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    // Don't set lang - let it use browser default
    // Edge can be particular about language codes

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // Accumulate final transcripts
      if (newFinalTranscript) {
        finalTranscriptRef.current += newFinalTranscript;
      }

      // Set transcript to accumulated final + current interim
      setTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let message = '';
      if (event.error.includes('language-not-supported')) {
        message = 'Browser does not support dictation';
      } else {
        message = event.error;
      }

      openErrorNotification({ message });
      setError(message);

      // Stop recognition and listening state
      recognition.stop();
      recognition.abort();
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [browserSupportsSpeechRecognition]);

  const onStartListening = useCallback(async () => {
    if (recognitionRef.current && !listening) {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // Reset transcripts when starting
        finalTranscriptRef.current = '';
        setTranscript('');
        recognitionRef.current.start();
      } catch (error) {
        console.error('Microphone error:', error);
        openErrorNotification({ message: `Microphone permission denied: ${error}` });
      }
    }
  }, [listening]);

  const onStopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [listening]);

  return {
    onStartListening,
    onStopListening,
    listening,
    error,
    transcript,
    browserSupportsSpeechRecognition: Boolean(browserSupportsSpeechRecognition),
    hasPermission,
  };
}
