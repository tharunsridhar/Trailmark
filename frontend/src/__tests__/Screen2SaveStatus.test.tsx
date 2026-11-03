import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Screen2DepartingQuestions } from '@/components/screens/Screen2DepartingQuestions';

const question = {
  id: '7',
  category: 'Backend Architecture',
  shortTitle: 'Backup owner',
  question: "Task T05 'Set up automated daily database backup to S3' has no owner. Who should own it?",
  reason: 'No owner in the task board',
  roleTarget: 'Backend Developer',
  status: 'open',
  evidenceStatus: 'missing_conflicting',
};

let saveAnswer: ReturnType<typeof vi.fn>;

vi.mock('@/context/HandoverContext', () => ({
  useHandover: () => ({
    project: { questions: [question] },
    questions: [],
    questionsLoading: false,
    loadQuestions: vi.fn(),
    activeHandover: { id: 1, status: 'draft' },
    activeHandoverId: 1,
    errorMessage: null,
    successMessage: null,
    clearMessages: vi.fn(),
    activeScreen: 'departing-questions',
    setActiveScreen: vi.fn(),
    saveAnswer: (...args: unknown[]) => saveAnswer(...args),
    skipQuestion: vi.fn(),
    markDontKnow: vi.fn(),
    getPiece: vi.fn(),
  }),
}));

describe('departing member answer screen', () => {
  it('does not say "saved" when the backend refuses the answer', async () => {
    saveAnswer = vi.fn().mockResolvedValue(false);
    render(<Screen2DepartingQuestions />);
    fireEvent.change(screen.getByRole('textbox', { name: /your answer/i }), { target: { value: 'Priya owns it' } });
    fireEvent.click(screen.getByRole('button', { name: /save answer/i }));
    await waitFor(() => expect(saveAnswer).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Not Saved')).toBeInTheDocument());
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved in backend')).not.toBeInTheDocument();
    // the typed text is still there so it can be tried again
    expect(screen.getByDisplayValue('Priya owns it')).toBeInTheDocument();
  });

  it('says "saved" only after the backend accepted the answer', async () => {
    saveAnswer = vi.fn().mockResolvedValue(true);
    render(<Screen2DepartingQuestions />);
    fireEvent.change(screen.getByRole('textbox', { name: /your answer/i }), { target: { value: 'Priya owns it' } });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /save answer/i }));
    await waitFor(() => expect(screen.getAllByText('Saved').length).toBeGreaterThan(0));
    expect(saveAnswer).toHaveBeenCalledWith('7', 'Priya owns it', undefined);
  });
});
