import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import PaymentStatusTracker from '../PaymentStatusTracker';
import * as paymentTrackingHooks from '@/hooks/useRealTimePaymentTracking';

// Mock the hooks
jest.mock('@/hooks/useRealTimePaymentTracking');

const mockUsePaymentTracking = paymentTrackingHooks.usePaymentTracking as jest.MockedFunction<typeof paymentTrackingHooks.usePaymentTracking>;
const mockUsePaymentConnectionStatus = paymentTrackingHooks.usePaymentConnectionStatus as jest.MockedFunction<typeof paymentTrackingHooks.usePaymentConnectionStatus>;

describe('PaymentStatusTracker', () => {
  const defaultProps = {
    transactionId: 'tx_123',
    initialStatus: 'pending',
    amount: 100,
    courseTitle: 'Test Course',
    studentName: 'John Doe',
    createdAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUsePaymentTracking.mockReturnValue({
      status: undefined,
      lastUpdate: undefined,
      error: undefined,
    });

    mockUsePaymentConnectionStatus.mockReturnValue({
      connected: true,
      reconnecting: false,
      error: undefined,
      retryConnection: jest.fn(),
    });
  });

  it('renders payment status tracker with initial status', () => {
    render(<PaymentStatusTracker {...defaultProps} />);

    expect(screen.getByText('Payment Status')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Payment is being processed')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays connection status correctly', () => {
    render(<PaymentStatusTracker {...defaultProps} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  it('shows offline status when disconnected', () => {
    mockUsePaymentConnectionStatus.mockReturnValue({
      connected: false,
      reconnecting: false,
      error: 'Connection lost',
      retryConnection: jest.fn(),
    });

    render(<PaymentStatusTracker {...defaultProps} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls retry connection when retry button is clicked', () => {
    const mockRetryConnection = jest.fn();
    mockUsePaymentConnectionStatus.mockReturnValue({
      connected: false,
      reconnecting: false,
      error: 'Connection lost',
      retryConnection: mockRetryConnection,
    });

    render(<PaymentStatusTracker {...defaultProps} />);

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockRetryConnection).toHaveBeenCalled();
  });

  it('updates status when real-time update is received', () => {
    const { rerender } = render(<PaymentStatusTracker {...defaultProps} />);

    // Initially pending
    expect(screen.getByText('Pending')).toBeInTheDocument();

    // Mock real-time update
    mockUsePaymentTracking.mockReturnValue({
      status: 'completed',
      lastUpdate: new Date('2024-01-15T10:05:00Z'),
      error: undefined,
    });

    rerender(<PaymentStatusTracker {...defaultProps} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Payment completed successfully')).toBeInTheDocument();
  });

  it('displays error message when payment fails', () => {
    mockUsePaymentTracking.mockReturnValue({
      status: 'failed',
      lastUpdate: new Date('2024-01-15T10:05:00Z'),
      error: 'Payment declined by bank',
    });

    render(<PaymentStatusTracker {...defaultProps} initialStatus="failed" />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Error: Payment declined by bank')).toBeInTheDocument();
    expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    expect(screen.getByText('Retry Payment')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('shows progress bar with correct value', () => {
    render(<PaymentStatusTracker {...defaultProps} initialStatus="processing" />);

    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows completed progress for successful payment', () => {
    render(<PaymentStatusTracker {...defaultProps} initialStatus="completed" />);

    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('View Receipt')).toBeInTheDocument();
  });

  it('calls onStatusChange when status updates', () => {
    const mockOnStatusChange = jest.fn();
    
    render(
      <PaymentStatusTracker 
        {...defaultProps} 
        onStatusChange={mockOnStatusChange}
      />
    );

    // Mock real-time update
    mockUsePaymentTracking.mockReturnValue({
      status: 'completed',
      lastUpdate: new Date('2024-01-15T10:05:00Z'),
      error: undefined,
    });

    // Trigger re-render to simulate status change
    render(
      <PaymentStatusTracker 
        {...defaultProps} 
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(mockOnStatusChange).toHaveBeenCalledWith('completed');
  });

  it('hides details when showDetails is false', () => {
    render(<PaymentStatusTracker {...defaultProps} showDetails={false} />);

    expect(screen.queryByText('Payment Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Amount:')).not.toBeInTheDocument();
    expect(screen.queryByText('Course:')).not.toBeInTheDocument();
  });

  it('displays transaction ID correctly', () => {
    render(<PaymentStatusTracker {...defaultProps} />);

    expect(screen.getByText('tx_123')).toBeInTheDocument();
  });

  it('shows real-time monitoring indicator for processing payments', () => {
    render(<PaymentStatusTracker {...defaultProps} initialStatus="processing" />);

    expect(screen.getByText('Monitoring payment status in real-time...')).toBeInTheDocument();
  });

  it('does not show real-time indicator when disconnected', () => {
    mockUsePaymentConnectionStatus.mockReturnValue({
      connected: false,
      reconnecting: false,
      error: undefined,
      retryConnection: jest.fn(),
    });

    render(<PaymentStatusTracker {...defaultProps} initialStatus="processing" />);

    expect(screen.queryByText('Monitoring payment status in real-time...')).not.toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(<PaymentStatusTracker {...defaultProps} amount={1234.56} />);

    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<PaymentStatusTracker {...defaultProps} />);

    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      transactionId: 'tx_123',
    };

    render(<PaymentStatusTracker {...minimalProps} />);

    expect(screen.getByText('Payment Status')).toBeInTheDocument();
    expect(screen.getByText('tx_123')).toBeInTheDocument();
  });

  it('displays status history when available', async () => {
    // Mock a payment that has gone through multiple status changes
    mockUsePaymentTracking.mockReturnValue({
      status: 'completed',
      lastUpdate: new Date('2024-01-15T10:05:00Z'),
      error: undefined,
    });

    const { rerender } = render(<PaymentStatusTracker {...defaultProps} />);

    // Simulate status change to trigger history update
    mockUsePaymentTracking.mockReturnValue({
      status: 'processing',
      lastUpdate: new Date('2024-01-15T10:02:00Z'),
      error: undefined,
    });

    rerender(<PaymentStatusTracker {...defaultProps} />);

    mockUsePaymentTracking.mockReturnValue({
      status: 'completed',
      lastUpdate: new Date('2024-01-15T10:05:00Z'),
      error: undefined,
    });

    rerender(<PaymentStatusTracker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Status History')).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes for different statuses', () => {
    const { rerender } = render(<PaymentStatusTracker {...defaultProps} initialStatus="completed" />);

    let statusBadge = screen.getByText('Completed').closest('.bg-green-100');
    expect(statusBadge).toBeInTheDocument();

    rerender(<PaymentStatusTracker {...defaultProps} initialStatus="failed" />);

    statusBadge = screen.getByText('Failed').closest('.bg-red-100');
    expect(statusBadge).toBeInTheDocument();
  });
});
