import { useState, useEffect, useRef, useCallback } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pl-PL';
      recognitionRef.current.onresult = (event) => setTranscript(event.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      if (recognitionRef.current && isListening) recognitionRef.current.stop();
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    setTranscript('');
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, supported: !!recognitionRef.current };
};

export default useSpeechRecognition;