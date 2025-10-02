import type { Meta, StoryObj } from '@storybook/react-vite';
import { useSpeechRecognition } from './useSpeechRecognition';

function SpeechRecognitionDemo() {
  const {
    onStartListening,
    onStopListening,
    listening,
    transcript,
    browserSupportsSpeechRecognition,
    error,
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h2>Speech Recognition Not Supported</h2>
        <p>Your browser does not support speech recognition.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>Speech Recognition Demo</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={onStartListening}
          disabled={listening}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            backgroundColor: listening ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: listening ? 'not-allowed' : 'pointer',
          }}
        >
          Start Listening
        </button>
        <button
          type="button"
          onClick={onStopListening}
          disabled={!listening}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: !listening ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !listening ? 'not-allowed' : 'pointer',
          }}
        >
          Stop Listening
        </button>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Status:</strong>{' '}
        <span style={{ color: listening ? '#28a745' : '#6c757d' }}>
          {listening ? 'Listening...' : 'Not listening'}
        </span>
      </div>
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
      <div>
        <strong>Transcript:</strong>
        <div
          style={{
            marginTop: '0.5rem',
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minHeight: '100px',
            backgroundColor: '#f8f9fa',
          }}
        >
          {transcript || 'No speech detected yet...'}
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Hooks/useSpeechRecognition',
  component: SpeechRecognitionDemo,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SpeechRecognitionDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
