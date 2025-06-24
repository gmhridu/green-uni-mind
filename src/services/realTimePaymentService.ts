import { io, Socket } from 'socket.io-client';
import { config } from '@/config';

export interface PaymentUpdate {
  type: 'payment_started' | 'payment_processing' | 'payment_completed' | 'payment_failed' | 'payout_processed' | 'earnings_updated';
  data: {
    transactionId?: string;
    payoutId?: string;
    amount?: number;
    status?: string;
    timestamp: string;
    userId: string;
    courseId?: string;
    studentId?: string;
    teacherId?: string;
    error?: string;
    metadata?: Record<string, any>;
  };
}

export interface PaymentNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
}

class RealTimePaymentService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;
  private listeners: Map<string, Set<Function>> = new Map();
  private notifications: PaymentNotification[] = [];
  private notificationListeners: Set<Function> = new Set();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    const wsUrl = config.wsBaseUrl;
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('No authentication token found for WebSocket connection');
      return;
    }

    this.socket = io(wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Real-time payment service connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Real-time payment service disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Real-time payment service connection error:', error);
      this.isConnected = false;
      this.emit('connection_error', { error: error.message });
      this.handleReconnection();
    });

    // Payment-specific events
    this.socket.on('payment_update', (update: PaymentUpdate) => {
      console.log('Payment update received:', update);
      this.handlePaymentUpdate(update);
    });

    this.socket.on('notification', (notification: PaymentNotification) => {
      console.log('Notification received:', notification);
      this.handleNotification(notification);
    });

    // Heartbeat to keep connection alive
    this.socket.on('ping', () => {
      this.socket?.emit('pong');
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.socket?.connect();
      }
    }, delay);
  }

  private handlePaymentUpdate(update: PaymentUpdate) {
    // Emit to specific listeners
    this.emit('payment_update', update);
    this.emit(`payment_${update.type}`, update);

    // Create notification for important updates
    if (update.type === 'payment_completed' || update.type === 'payment_failed' || update.type === 'payout_processed') {
      const notification = this.createNotificationFromUpdate(update);
      this.handleNotification(notification);
    }

    // Update local state based on update type
    this.updateLocalState(update);
  }

  private createNotificationFromUpdate(update: PaymentUpdate): PaymentNotification {
    const { type, data } = update;
    let title = '';
    let message = '';
    let notificationType: PaymentNotification['type'] = 'info';

    switch (type) {
      case 'payment_completed':
        title = 'Payment Received';
        message = `You received $${data.amount?.toFixed(2)} from a course purchase`;
        notificationType = 'success';
        break;
      case 'payment_failed':
        title = 'Payment Failed';
        message = `A payment of $${data.amount?.toFixed(2)} failed to process`;
        notificationType = 'error';
        break;
      case 'payout_processed':
        title = 'Payout Processed';
        message = `Your payout of $${data.amount?.toFixed(2)} has been processed`;
        notificationType = 'success';
        break;
      default:
        title = 'Payment Update';
        message = 'A payment status has been updated';
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: notificationType,
      title,
      message,
      timestamp: data.timestamp,
      read: false,
      data: data
    };
  }

  private handleNotification(notification: PaymentNotification) {
    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Notify listeners
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private updateLocalState(update: PaymentUpdate) {
    // Update cached data based on payment updates
    const { type, data } = update;

    switch (type) {
      case 'earnings_updated':
        // Trigger earnings refetch
        this.emit('earnings_changed', data);
        break;
      case 'payment_completed':
        // Trigger transaction list refetch
        this.emit('transactions_changed', data);
        break;
      case 'payout_processed':
        // Trigger payout list refetch
        this.emit('payouts_changed', data);
        break;
    }
  }

  // Public methods
  public connect() {
    if (!this.socket || !this.isConnected) {
      this.initializeConnection();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  public subscribeToNotifications(callback: Function): () => void {
    this.notificationListeners.add(callback);
    
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  public getNotifications(): PaymentNotification[] {
    return [...this.notifications];
  }

  public getUnreadNotifications(): PaymentNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  public markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  public markAllNotificationsAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  public clearNotifications() {
    this.notifications = [];
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      });
    }
  }

  // Teacher-specific methods
  public subscribeToTeacherPayments(teacherId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_teacher_payments', { teacherId });
    }
  }

  public unsubscribeFromTeacherPayments(teacherId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_teacher_payments', { teacherId });
    }
  }

  // Student-specific methods
  public subscribeToStudentPayments(studentId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_student_payments', { studentId });
    }
  }

  public unsubscribeFromStudentPayments(studentId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_student_payments', { studentId });
    }
  }

  // Manual retry methods
  public retryConnection() {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  public getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketConnected: this.socket?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Create singleton instance
export const realTimePaymentService = new RealTimePaymentService();

// React hook for using the service
export const useRealTimePayments = () => {
  return realTimePaymentService;
};
