import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceRecorder } from '@/components/interview/VoiceRecorder';

function stubMicrophone(errorName: string) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockRejectedValue(new DOMException(errorName, errorName)) },
  });
}

describe('VoiceRecorder when the microphone is not available', () => {
  it('shows a clear message and keeps the typed text when permission is denied', async () => {
    stubMicrophone('NotAllowedError');
    const onText = vi.fn();
    render(<VoiceRecorder initialText="my typed answer" onTranscriptionComplete={onText} />);
    fireEvent.click(screen.getByText('Start Recording'));
    await waitFor(() => expect(screen.getByText(/Microphone access was denied/)).toBeInTheDocument());
    expect(screen.getByDisplayValue('my typed answer')).toBeInTheDocument();
    expect(onText).not.toHaveBeenCalled();
  });

  it('says so when there is no microphone, and keeps the text', async () => {
    stubMicrophone('NotFoundError');
    render(<VoiceRecorder initialText="kept" onTranscriptionComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('Start Recording'));
    await waitFor(() => expect(screen.getByText(/No microphone was found/)).toBeInTheDocument());
    expect(screen.getByDisplayValue('kept')).toBeInTheDocument();
  });

  it('does not show the recording state after a refusal', async () => {
    stubMicrophone('NotAllowedError');
    render(<VoiceRecorder onTranscriptionComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('Start Recording'));
    await waitFor(() => expect(screen.getByText(/Microphone access was denied/)).toBeInTheDocument());
    expect(screen.queryByText('Stop Recording')).not.toBeInTheDocument();
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
  });
});
