import { type ReactNode, type ElementType } from 'react';
import { useTextToSpeech } from '../contexts/TextToSpeechContext';

interface SpeakableTextProps {
  children: ReactNode;
  text?: string;
  className?: string;
  as?: ElementType;
}

/**
 * SpeakableText Component
 * Wraps text content to make it speak on hover when TTS is enabled
 */
function SpeakableText({ children, text, className = '', as: Component = 'span' }: SpeakableTextProps) {
  const { enabled, speak } = useTextToSpeech();

  const handleMouseEnter = () => {
    if (!enabled) return;
    
    // Use provided text prop, or extract text from children
    const textToSpeak = text || (typeof children === 'string' ? children : '');
    speak(textToSpeak);
  };

  if (!enabled) {
    // When TTS is disabled, render children directly without wrapper
    return <>{children}</>;
  }

  return (
    <Component
      className={`cursor-pointer hover:bg-opacity-10 hover:bg-blue-500 transition-colors ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </Component>
  );
}

export default SpeakableText;
