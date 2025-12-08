import { useTextToSpeech } from '../contexts/TextToSpeechContext';

/**
 * Text-to-Speech Toggle Button
 * Allows users to enable or disable text-to-speech on hover globally
 */
function TextToSpeechButton() {
  const { enabled, toggle } = useTextToSpeech();

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-24 z-50 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-5 rounded-full shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-110"
      aria-pressed={enabled}
      aria-label={enabled ? 'Text-to-speech enabled. Click to disable.' : 'Text-to-speech disabled. Click to enable.'}
      title={enabled ? 'Text-to-speech enabled - hover over text to hear it' : 'Text-to-speech disabled - click to enable'}
      style={{ minWidth: '60px', minHeight: '60px' }}
    >
      <span className="text-xl font-bold">{enabled ? '🔊' : '🔇'}</span>
    </button>
  );
}

export default TextToSpeechButton;
