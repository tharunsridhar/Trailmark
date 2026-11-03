import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceBadge } from '@/components/EvidenceBadge';

describe('EvidenceBadge', () => {
  it('shows the label for each evidence status', () => {
    const { rerender } = render(<EvidenceBadge status="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();

    rerender(<EvidenceBadge status="unverified" />);
    expect(screen.getByText('Unverified (Leaver Statement)')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();

    rerender(<EvidenceBadge status="missing_conflicting" />);
    expect(screen.getByText('Missing / Conflicting')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('explains each status in the tooltip', () => {
    const { container, rerender } = render(<EvidenceBadge status="unverified" />);
    expect(container.firstChild).toHaveAttribute('title', expect.stringContaining('not yet independently verified'));
    rerender(<EvidenceBadge status="missing_conflicting" />);
    expect(container.firstChild).toHaveAttribute('title', expect.stringContaining('contradict'));
  });
});
