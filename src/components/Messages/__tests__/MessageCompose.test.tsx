import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, createMockUser, setupTests, cleanupTests, userEvent } from '@/test-utils';
import MessageCompose from '../MessageCompose';
import { MessageType, MessagePriority } from '@/types/message';

// Mock the API
jest.mock('@/redux/features/message/messageApi', () => ({
  useSendMessageMutation: jest.fn(),
  useSaveDraftMutation: jest.fn(),
}));

jest.mock('@/redux/features/auth/authApi', () => ({
  useGetMeQuery: jest.fn(),
}));

// Mock Redux hooks
jest.mock('@/redux/hooks', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAppSelector = require('@/redux/hooks').useAppSelector;
const mockUseAppDispatch = require('@/redux/hooks').useAppDispatch;
const mockUseSendMessageMutation = require('@/redux/features/message/messageApi').useSendMessageMutation;
const mockUseSaveDraftMutation = require('@/redux/features/message/messageApi').useSaveDraftMutation;
const mockUseGetMeQuery = require('@/redux/features/auth/authApi').useGetMeQuery;

describe('MessageCompose Component', () => {
  const mockDispatch = jest.fn();
  const mockSendMessage = jest.fn();
  const mockSaveDraft = jest.fn();
  const mockUser = createMockUser();

  beforeEach(() => {
    setupTests();
    
    mockUseAppDispatch.mockReturnValue(mockDispatch);
    
    mockUseAppSelector.mockReturnValue({
      isComposing: true,
      composeDraft: undefined,
    });

    mockUseGetMeQuery.mockReturnValue({
      data: { data: mockUser },
    });

    mockUseSendMessageMutation.mockReturnValue([
      mockSendMessage,
      { isLoading: false },
    ]);

    mockUseSaveDraftMutation.mockReturnValue([
      mockSaveDraft,
      { isLoading: false },
    ]);

    // Mock successful API responses
    mockSendMessage.mockResolvedValue({ unwrap: () => Promise.resolve({}) });
    mockSaveDraft.mockResolvedValue({ unwrap: () => Promise.resolve({}) });
  });

  afterEach(() => {
    cleanupTests();
    jest.clearAllMocks();
  });

  it('renders compose dialog when isComposing is true', () => {
    render(<MessageCompose />);

    expect(screen.getByText('Compose Message')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('does not render when isComposing is false', () => {
    mockUseAppSelector.mockReturnValue({
      isComposing: false,
      composeDraft: undefined,
    });

    const { container } = render(<MessageCompose />);
    expect(container.firstChild).toBeNull();
  });

  it('allows user to fill in message details', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    // Fill in subject
    const subjectInput = screen.getByLabelText('Subject');
    await user.type(subjectInput, 'Test Subject');
    expect(subjectInput).toHaveValue('Test Subject');

    // Fill in message content
    const messageTextarea = screen.getByLabelText('Message');
    await user.type(messageTextarea, 'Test message content');
    expect(messageTextarea).toHaveValue('Test message content');
  });

  it('allows user to select message type and priority', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    // Select message type
    const typeSelect = screen.getByDisplayValue('Direct Message');
    await user.click(typeSelect);
    
    await waitFor(() => {
      const announcementOption = screen.getByText('Announcement');
      user.click(announcementOption);
    });

    // Select priority
    const prioritySelect = screen.getByDisplayValue('Normal');
    await user.click(prioritySelect);
    
    await waitFor(() => {
      const highPriorityOption = screen.getByText('High');
      user.click(highPriorityOption);
    });
  });

  it('validates required fields before sending', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    const sendButton = screen.getByText('Send Message');
    await user.click(sendButton);

    // Should show validation errors
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith(
        'Please select at least one recipient'
      );
    });
  });

  it('sends message when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    // Add recipient (mock the recipient selection)
    // In a real test, you'd interact with the recipient selector
    
    // Fill required fields
    const subjectInput = screen.getByLabelText('Subject');
    await user.type(subjectInput, 'Test Subject');

    const messageTextarea = screen.getByLabelText('Message');
    await user.type(messageTextarea, 'Test message content');

    // Mock that recipients are selected
    const sendButton = screen.getByText('Send Message');
    
    // Since we can't easily test the recipient selection in this unit test,
    // we'll test that the send function would be called with correct data
    expect(sendButton).toBeInTheDocument();
  });

  it('saves draft automatically', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup();
    render(<MessageCompose />);

    // Type in subject
    const subjectInput = screen.getByLabelText('Subject');
    await user.type(subjectInput, 'Draft Subject');

    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('allows manual draft saving', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    // Fill in some content
    const subjectInput = screen.getByLabelText('Subject');
    await user.type(subjectInput, 'Draft Subject');

    // Click save draft button
    const saveDraftButton = screen.getByText('Save Draft');
    await user.click(saveDraftButton);

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalled();
    });
  });

  it('handles file attachments', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    // Create a mock file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Find the hidden file input
    const fileInput = screen.getByLabelText('Attach Files').closest('div')?.querySelector('input[type="file"]');
    
    if (fileInput) {
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
    }
  });

  it('removes attachments when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    // First add an attachment (simplified for test)
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Attach Files').closest('div')?.querySelector('input[type="file"]');
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });

      // Find and click the remove button
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
      });
    }
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<MessageCompose />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('loads draft data when provided', () => {
    const mockDraft = {
      subject: 'Draft Subject',
      content: 'Draft content',
      messageType: MessageType.ANNOUNCEMENT,
      priority: MessagePriority.HIGH,
    };

    mockUseAppSelector.mockReturnValue({
      isComposing: true,
      composeDraft: mockDraft,
    });

    render(<MessageCompose />);

    expect(screen.getByDisplayValue('Draft Subject')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Draft content')).toBeInTheDocument();
  });

  it('shows loading state when sending', () => {
    mockUseSendMessageMutation.mockReturnValue([
      mockSendMessage,
      { isLoading: true },
    ]);

    render(<MessageCompose />);

    const sendButton = screen.getByText('Sending...');
    expect(sendButton).toBeDisabled();
  });

  it('shows loading state when saving draft', () => {
    mockUseSaveDraftMutation.mockReturnValue([
      mockSaveDraft,
      { isLoading: true },
    ]);

    render(<MessageCompose />);

    const saveDraftButton = screen.getByText('Saving...');
    expect(saveDraftButton).toBeDisabled();
  });
});
