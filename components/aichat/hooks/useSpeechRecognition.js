// aichat/hooks/useSpeechRecognition.js
// React hook for speech recognition functionality

import { useState, useEffect, useRef, useCallback } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check if speech recognition is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSupported(!!SpeechRecognition);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!supported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pl-PL'; // Polish language
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;
        const confidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcriptPart;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcriptPart;
        }
      }

      // Update state
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        setConfidence(maxConfidence);
        setInterimTranscript('');
        
        // Auto-stop after getting final result
        setTimeout(() => {
          stopListening();
        }, 1000);
      } else {
        setInterimTranscript(interimTranscript);
      }

      // Reset timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Auto-stop after 30 seconds of inactivity
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      const errorMessages = {
        'network': 'Błąd sieci. Sprawdź połączenie internetowe.',
        'not-allowed': 'Dostęp do mikrofonu został zablokowany. Sprawdź ustawienia przeglądarki.',
        'no-speech': 'Nie wykryto mowy. Spróbuj ponownie.',
        'audio-capture': 'Nie można uzyskać dostępu do mikrofonu.',
        'service-not-allowed': 'Usługa rozpoznawania mowy jest niedostępna.',
        'bad-grammar': 'Błąd gramatyki rozpoznawania.',
        'language-not-supported': 'Wybrany język nie jest obsługiwany.',
        'aborted': 'Rozpoznawanie zostało przerwane.'
      };

      setError(errorMessages[event.error] || `Błąd rozpoznawania mowy: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Speech recognition ended');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [supported]);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) {
      setError('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce.');
      return;
    }

    if (isListening) return;

    // Clear previous transcript and interim results
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setConfidence(0);

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Nie można uruchomić rozpoznawania mowy. Spróbuj ponownie.');
    }
  }, [supported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setConfidence(0);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Get browser compatibility info
  const getBrowserSupport = useCallback(() => {
    if (typeof window === 'undefined') return { supported: false, reason: 'Server-side rendering' };
    
    const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window;
    
    if (!hasWebkitSpeechRecognition && !hasSpeechRecognition) {
      return { 
        supported: false, 
        reason: 'Przeglądarka nie obsługuje Web Speech API' 
      };
    }

    // Check if HTTPS is required (most browsers require secure context)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return { 
        supported: false, 
        reason: 'Wymagane jest połączenie HTTPS' 
      };
    }

    return { supported: true };
  }, []);

  // Get microphone permission status
  const checkMicrophonePermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      return permission.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return 'unknown';
    }
  }, []);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setError('Dostęp do mikrofonu został odrzucony.');
      return false;
    }
  }, []);

  // Get current language
  const getCurrentLanguage = useCallback(() => {
    return recognitionRef.current?.lang || 'pl-PL';
  }, []);

  // Set language
  const setLanguage = useCallback((lang) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, []);

  // Get list of supported languages (common ones)
  const getSupportedLanguages = useCallback(() => {
    return [
      { code: 'pl-PL', name: 'Polski' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'es-ES', name: 'Español' },
      { code: 'it-IT', name: 'Italiano' },
      { code: 'ru-RU', name: 'Русский' }
    ];
  }, []);

  return {
    // Core functionality
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    toggleListening,
    
    // Status and metadata
    supported,
    error,
    confidence,
    
    // Utility functions
    getBrowserSupport,
    checkMicrophonePermission,
    requestMicrophonePermission,
    getCurrentLanguage,
    setLanguage,
    getSupportedLanguages,
    
    // Combined transcript for display
    fullTranscript: transcript + (interimTranscript ? ` ${interimTranscript}` : ''),
    
    // Status flags
    hasError: !!error,
    hasTranscript: !!transcript,
    hasInterimTranscript: !!interimTranscript
  };
};

export default useSpeechRecognition;