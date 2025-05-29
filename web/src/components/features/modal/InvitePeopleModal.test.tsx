import { useInviteUser } from '@/api/buster_rest/users';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitePeopleModal } from './InvitePeopleModal';

// Mock the hooks
vi.mock('@/api/buster_rest/users', () => ({
  useInviteUser: vi.fn()
}));

vi.mock('@/context/BusterNotifications', () => ({
  useBusterNotifications: vi.fn()
}));

describe('InvitePeopleModal', () => {
  const mockOnClose = vi.fn();
  const mockMutateAsync = vi.fn();
  const mockOpenErrorMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useInviteUser as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false
    });
    (useBusterNotifications as any).mockReturnValue({
      openErrorMessage: mockOpenErrorMessage
    });
  });

  it('renders correctly when open', () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    expect(screen.getByText('Invite others to join your workspace')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buster@bluthbananas.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send invites' })).toBeDisabled();
  });

  it('handles valid email input', async () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/buster@bluthbananas.com/);
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Send invites')).toBeEnabled();
  });

  it('handles invalid email input', () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/buster@bluthbananas.com/);
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOpenErrorMessage).toHaveBeenCalledWith('Invalid email');
    expect(screen.queryByText('invalid-email')).not.toBeInTheDocument();
  });

  it('handles multiple email inputs', () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/buster@bluthbananas.com/);
    fireEvent.change(input, { target: { value: 'test1@example.com, test2@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();
  });

  it('removes email tag when clicked', async () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/buster@bluthbananas.com/);
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const tag = screen.getByText('test@example.com').closest('[data-tag="true"]');
    expect(tag).toBeInTheDocument();

    const removeButton = tag?.querySelector('button');
    expect(removeButton).toBeInTheDocument();
    fireEvent.pointerDown(removeButton!);

    await waitFor(() => {
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  it('sends invites when submit button is clicked', async () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/buster@bluthbananas.com/);
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const submitButton = screen.getByText('Send invites');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        emails: ['test@example.com']
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('deduplicates email addresses', async () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/buster@bluthbananas.com/);
    fireEvent.change(input, { target: { value: 'test@example.com, test@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const submitButton = screen.getByText('Send invites');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        emails: ['test@example.com']
      });
    });
  });

  it('handles pasting multiple email addresses', async () => {
    render(<InvitePeopleModal open={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/buster@bluthbananas.com/);
    const pastedEmails = 'test1@example.com, test2@example.com, test3@example.com';

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => pastedEmails
      }
    });

    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    expect(screen.getByText('test3@example.com')).toBeInTheDocument();

    // Remove the first email
    const firstTag = screen.getByText('test1@example.com').closest('[data-tag="true"]');
    const removeButton = firstTag?.querySelector('button');
    fireEvent.pointerDown(removeButton!);

    await waitFor(() => {
      expect(screen.queryByText('test1@example.com')).not.toBeInTheDocument();
      expect(screen.getByText('test2@example.com')).toBeInTheDocument();
      expect(screen.getByText('test3@example.com')).toBeInTheDocument();
    });
  });
});
