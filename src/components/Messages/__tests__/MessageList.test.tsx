import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, createMockThread, createMockUser, mockApiResponse, mockPaginatedResponse, setupTests, cleanupTests } from '@/test-utils';
import MessageList from '../MessageList';
import { FolderType } from '@/types/message';
import { baseApi } from '@/redux/api/baseApi';

// Mock the API
jest.mock('@/redux/features/message/messageApi', () => ({
  useGetMessagesByFolderQuery: jest.fn(),
  useMarkThreadAsReadMutation: jest.fn(),
  useToggleThreadArchiveMutation: jest.fn(),
  useDeleteMessagesMutation: jest.fn(),
}));

jest.mock('@/redux/features/auth/authApi', () => ({
  useGetMeQuery: jest.fn(),
}));

const mockUseGetMessagesByFolderQuery = require('@/redux/features/message/messageApi').useGetMessagesByFolderQuery;
const mockUseGetMeQuery = require('@/redux/features/auth/authApi').useGetMeQuery;
const mockUseMarkThreadAsReadMutation = require('@/redux/features/message/messageApi').useMarkThreadAsReadMutation;

describe('MessageList Component', () => {
  const mockOnThreadSelect = jest.fn();
  const mockMarkAsRead = jest.fn();
  const mockUser = createMockUser();
  const mockThreads = [
    createMockThread({
      _id: 'thread-1',
      subject: 'First Thread',
      unreadCount: 2,
    }),
    createMockThread({
      _id: 'thread-2',
      subject: 'Second Thread',
      unreadCount: 0,
    }),
  ];

  beforeEach(() => {
    setupTests();
    
    // Mock user data
    mockUseGetMeQuery.mockReturnValue({
      data: { data: mockUser },
    });

    // Mock mark as read mutation
    mockUseMarkThreadAsReadMutation.mockReturnValue([
      mockMarkAsRead,
      { isLoading: false },
    ]);

    // Mock threads data
    mockUseGetMessagesByFolderQuery.mockReturnValue({
      data: mockApiResponse(mockPaginatedResponse(mockThreads)),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    cleanupTests();
    jest.clearAllMocks();
  });

  it('renders message list correctly', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First Thread')).toBeInTheDocument();
      expect(screen.getByText('Second Thread')).toBeInTheDocument();
    });
  });

  it('displays unread count badges', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      // First thread should have unread badge
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Second thread should not have unread badge (unreadCount is 0)
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  it('calls onThreadSelect when thread is clicked', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      const firstThread = screen.getByText('First Thread');
      fireEvent.click(firstThread.closest('[role="button"]') || firstThread);
    });

    expect(mockOnThreadSelect).toHaveBeenCalledWith('thread-1');
  });

  it('marks thread as read when clicked if unread', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      const firstThread = screen.getByText('First Thread');
      fireEvent.click(firstThread.closest('[role="button"]') || firstThread);
    });

    expect(mockMarkAsRead).toHaveBeenCalledWith({ threadId: 'thread-1' });
  });

  it('does not mark thread as read if already read', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      const secondThread = screen.getByText('Second Thread');
      fireEvent.click(secondThread.closest('[role="button"]') || secondThread);
    });

    // Should not call markAsRead for thread with unreadCount 0
    expect(mockMarkAsRead).not.toHaveBeenCalledWith({ threadId: 'thread-2' });
  });

  it('shows loading state', () => {
    mockUseGetMessagesByFolderQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    // Should show skeleton loaders
    expect(screen.getAllByTestId('skeleton')).toHaveLength(10);
  });

  it('shows empty state when no messages', async () => {
    mockUseGetMessagesByFolderQuery.mockReturnValue({
      data: mockApiResponse(mockPaginatedResponse([])),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No messages found')).toBeInTheDocument();
      expect(screen.getByText('Your inbox is empty')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(searchInput).toHaveValue('test search');
  });

  it('handles bulk selection', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      // Click select all checkbox
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);
    });

    // Should show bulk actions
    await waitFor(() => {
      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByText('Mark Read')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('displays participant information correctly', async () => {
    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      // Should show participant names (other than current user)
      const participantNames = screen.getAllByText(/John Doe|Jane/);
      expect(participantNames.length).toBeGreaterThan(0);
    });
  });

  it('shows attachment indicators', async () => {
    const threadsWithAttachments = [
      createMockThread({
        _id: 'thread-with-attachment',
        subject: 'Thread with attachment',
        lastMessage: {
          ...createMockThread().lastMessage,
          attachments: [
            {
              _id: 'attachment-1',
              fileName: 'document.pdf',
              fileUrl: 'http://example.com/document.pdf',
              fileType: 'application/pdf',
              fileSize: 1024,
              uploadedAt: new Date().toISOString(),
            },
          ],
        },
      }),
    ];

    mockUseGetMessagesByFolderQuery.mockReturnValue({
      data: mockApiResponse(mockPaginatedResponse(threadsWithAttachments)),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      // Should show paperclip icon for attachments
      expect(screen.getByTestId('attachment-icon')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    const paginationData = {
      data: mockThreads,
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    };

    mockUseGetMessagesByFolderQuery.mockReturnValue({
      data: mockApiResponse(paginationData),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <MessageList
        onThreadSelect={mockOnThreadSelect}
        currentFolder={FolderType.INBOX}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
  });
});
