import { useEffect, useRef, useState } from 'react';

// Speech-to-text using the browser's built-in Web Speech API (free, works best in Chrome/Edge)
export default function useSpeech(onText) {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const recRef = useRef(null);
  const baseRef = useRef('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => recRef.current?.stop(), []);

  const start = (existingText = '') => {
    if (!SR) return setError('Voice input is not supported in this browser. Try Chrome or Edge.');
    setError('');
    baseRef.current = existingText ? existingText.trim() + ' ' : '';
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onText(baseRef.current + text);
    };
    rec.onerror = (e) =>
      setError(e.error === 'not-allowed' ? 'Microphone permission was blocked.' : `Voice error: ${e.error}`);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => recRef.current?.stop();

  return { supported: Boolean(SR), listening, error, start, stop };
}
