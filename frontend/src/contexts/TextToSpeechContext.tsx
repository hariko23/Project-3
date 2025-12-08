import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface TextToSpeechContextType {
  enabled: boolean;
  toggle: () => void;
  speak: (text: string) => void;
  stop: () => void;
}

const TextToSpeechContext = createContext<TextToSpeechContextType | undefined>(undefined);

export function TextToSpeechProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  const toggle = () => {
    setEnabled(prev => !prev);
    // Stop any ongoing speech when toggling off
    if (enabled && synth) {
      synth.cancel();
    }
  };

  const speak = (text: string) => {
    if (!enabled || !synth || !text.trim()) return;

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    synth.speak(utterance);
  };

  const stop = () => {
    if (synth) {
      synth.cancel();
    }
  };

  return (
    <TextToSpeechContext.Provider value={{ enabled, toggle, speak, stop }}>
      {children}
    </TextToSpeechContext.Provider>
  );
}

export function useTextToSpeech() {
  const context = useContext(TextToSpeechContext);
  if (context === undefined) {
    throw new Error('useTextToSpeech must be used within a TextToSpeechProvider');
  }
  return context;
}
