import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimePaymentService, PaymentUpdate, PaymentNotification } from '@/services/realTimePaymentService';
import { useGetMeQuery } from '@/redux/features/auth/authApi';

interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  lastConnected?: Date;
}

interface PaymentTrackingState {
  connectionStatus: ConnectionStatus;
  notifications: PaymentNotification[];
  unreadCount: number;
  recentUpdates: PaymentUpdate[];
  isSubscribed: boolean;
}

export const useRealTimePaymentTracking = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const userId = userData?.data?._id;
  const userRole = userData?.data?.role;

  const [state, setState] = useState<PaymentTrackingState>({
    connectionStatus: {
      connected: false,
      reconnecting: false,
    },
    notifications: [],
    unreadCount: 0,
    recentUpdates: [],
    isSubscribed: false,
  });

  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Connection status handler
  const handleConnectionStatus = useCallback((status: { connected: boolean; reason?: string }) => {
    setState(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        connected: status.connected,
        reconnecting: !status.connected,
        lastConnected: status.connected ? new Date() : prev.connectionStatus.lastConnected,
        error: status.reason && !status.connected ? status.reason : undefined,
      }
    }));
  }, []);

  // Connection error handler
  const handleConnectionError = useCallback((error: { error: string }) => {
    setState(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        connected: false,
        reconnecting: true,
        error: error.error,
      }
    }));
  }, []);

  // Payment update handler
  const handlePaymentUpdate = useCallback((update: PaymentUpdate) => {
    setState(prev => ({
      ...prev,
      recentUpdates: [update, ...prev.recentUpdates.slice(0, 19)] // Keep last 20 updates
    }));
  }, []);

  // Notification handler
  const handleNotification = useCallback((notification: PaymentNotification) => {
    setState(prev => {
      const newNotifications = [notification, ...prev.notifications];
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      };
    });
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    // Clear previous subscriptions
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];

    // Subscribe to connection events
    const unsubConnection = realTimePaymentService.subscribe('connection_status', handleConnectionStatus);
    const unsubError = realTimePaymentService.subscribe('connection_error', handleConnectionError);
    const unsubPaymentUpdate = realTimePaymentService.subscribe('payment_update', handlePaymentUpdate);
    const unsubNotifications = realTimePaymentService.subscribeToNotifications(handleNotification);

    unsubscribeRefs.current.push(unsubConnection, unsubError, unsubPaymentUpdate, unsubNotifications);

    // Subscribe to user-specific payment events
    if (userRole === 'teacher') {
      realTimePaymentService.subscribeToTeacherPayments(userId);
    } else if (userRole === 'student') {
      realTimePaymentService.subscribeToStudentPayments(userId);
    }

    // Load existing notifications
    const existingNotifications = realTimePaymentService.getNotifications();
    setState(prev => ({
      ...prev,
      notifications: existingNotifications,
      unreadCount: realTimePaymentService.getUnreadNotifications().length,
      isSubscribed: true,
      connectionStatus: {
        ...prev.connectionStatus,
        connected: realTimePaymentService.isConnectionActive(),
      }
    }));

    // Cleanup function
    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub());
      
      if (userRole === 'teacher') {
        realTimePaymentService.unsubscribeFromTeacherPayments(userId);
      } else if (userRole === 'student') {
        realTimePaymentService.unsubscribeFromStudentPayments(userId);
      }
    };
  }, [userId, userRole, handleConnectionStatus, handleConnectionError, handlePaymentUpdate, handleNotification]);

  // Manual connection retry
  const retryConnection = useCallback(() => {
    setState(prev => ({
      ...prev,
      connectionStatus: {
        ...prev.connectionStatus,
        reconnecting: true,
        error: undefined,
      }
    }));
    realTimePaymentService.retryConnection();
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    realTimePaymentService.markNotificationAsRead(notificationId);
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    realTimePaymentService.markAllNotificationsAsRead();
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    realTimePaymentService.clearNotifications();
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0,
    }));
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: PaymentNotification['type']) => {
    return state.notifications.filter(n => n.type === type);
  }, [state.notifications]);

  // Get recent payment updates by type
  const getUpdatesByType = useCallback((type: PaymentUpdate['type']) => {
    return state.recentUpdates.filter(u => u.type === type);
  }, [state.recentUpdates]);

  return {
    // Connection state
    isConnected: state.connectionStatus.connected,
    isReconnecting: state.connectionStatus.reconnecting,
    connectionError: state.connectionStatus.error,
    lastConnected: state.connectionStatus.lastConnected,
    isSubscribed: state.isSubscribed,

    // Notifications
    notifications: state.notifications,
    unreadNotifications: state.notifications.filter(n => !n.read),
    unreadCount: state.unreadCount,

    // Recent updates
    recentUpdates: state.recentUpdates,
    recentPayments: state.recentUpdates.filter(u => 
      u.type === 'payment_completed' || u.type === 'payment_failed'
    ),
    recentPayouts: state.recentUpdates.filter(u => u.type === 'payout_processed'),

    // Actions
    retryConnection,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    getNotificationsByType,
    getUpdatesByType,

    // Service access
    service: realTimePaymentService,
  };
};

// Hook for specific payment tracking
export const usePaymentTracking = (transactionId?: string) => {
  const [paymentStatus, setPaymentStatus] = useState<{
    status?: string;
    lastUpdate?: Date;
    error?: string;
  }>({});

  useEffect(() => {
    if (!transactionId) return;

    const unsubscribe = realTimePaymentService.subscribe('payment_update', (update: PaymentUpdate) => {
      if (update.data.transactionId === transactionId) {
        setPaymentStatus({
          status: update.data.status,
          lastUpdate: new Date(update.data.timestamp),
          error: update.data.error,
        });
      }
    });

    return unsubscribe;
  }, [transactionId]);

  return paymentStatus;
};

// Hook for earnings tracking
export const useEarningsTracking = () => {
  const [earningsUpdate, setEarningsUpdate] = useState<{
    amount?: number;
    lastUpdate?: Date;
  }>({});

  useEffect(() => {
    const unsubscribe = realTimePaymentService.subscribe('earnings_changed', (data: any) => {
      setEarningsUpdate({
        amount: data.amount,
        lastUpdate: new Date(),
      });
    });

    return unsubscribe;
  }, []);

  return earningsUpdate;
};

// Hook for connection status only
export const usePaymentConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    reconnecting: false,
    error: undefined as string | undefined,
  });

  useEffect(() => {
    const unsubConnection = realTimePaymentService.subscribe('connection_status', (status: any) => {
      setConnectionStatus(prev => ({
        ...prev,
        connected: status.connected,
        reconnecting: !status.connected,
      }));
    });

    const unsubError = realTimePaymentService.subscribe('connection_error', (error: any) => {
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        reconnecting: true,
        error: error.error,
      }));
    });

    // Set initial status
    setConnectionStatus({
      connected: realTimePaymentService.isConnectionActive(),
      reconnecting: false,
      error: undefined,
    });

    return () => {
      unsubConnection();
      unsubError();
    };
  }, []);

  return {
    ...connectionStatus,
    retryConnection: () => realTimePaymentService.retryConnection(),
  };
};
