import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { config } from '@/config';
import { toast } from 'sonner';
import { Logger } from '@/utils/logger';

interface RealTimeUpdate {
  type: 'enrollment' | 'revenue' | 'activity' | 'performance' | 'pong';
  data: any;
  timestamp: string;
}

interface UseRealTimeAnalyticsOptions {
  enableWebSocket?: boolean;
  pollingInterval?: number;
  onUpdate?: (update: RealTimeUpdate) => void;
}

export const useRealTimeAnalytics = (options: UseRealTimeAnalyticsOptions = {}) => {
  const {
    enableWebSocket = true,
    pollingInterval = 30000, // 30 seconds
    onUpdate
  } = options;

  const { user, token } = useSelector((state: RootState) => state.auth);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // WebSocket connection management
  const connectWebSocket = () => {
    if (!user?._id || !token || !enableWebSocket) return;

    try {
      const wsUrl = `${config.wsBaseUrl}/analytics/${user._id}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        Logger.info('Analytics WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        
        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        ws.onclose = () => {
          clearInterval(heartbeat);
        };
      };

      ws.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data);
          
          if (update.type !== 'pong') { // Ignore pong responses
            Logger.info('Received real-time analytics update:', update.type);
            setLastUpdate(new Date());
            
            // Call the update handler if provided
            if (onUpdate) {
              onUpdate(update);
            }

            // Show toast notification for important updates
            if (update.type === 'enrollment') {
              toast.success('New student enrollment!', {
                description: 'Your analytics have been updated with new enrollment data.'
              });
            } else if (update.type === 'revenue') {
              toast.success('New payment received!', {
                description: 'Your revenue analytics have been updated.'
              });
            }
          }
        } catch (error) {
          Logger.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        Logger.error('Analytics WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        Logger.info('Analytics WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          Logger.info(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts');
          toast.error('Real-time updates disconnected', {
            description: 'Please refresh the page to restore real-time updates.'
          });
        }
      };

      wsRef.current = ws;
    } catch (error) {
      Logger.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish WebSocket connection');
    }
  };

  // Polling fallback
  const startPolling = () => {
    if (!pollingInterval || pollingInterval <= 0) return;

    pollingRef.current = setInterval(() => {
      // This would trigger a refetch of analytics data
      // The actual refetch is handled by the components using RTK Query
      setLastUpdate(new Date());
      
      if (onUpdate) {
        onUpdate({
          type: 'activity',
          data: { polling: true },
          timestamp: new Date().toISOString()
        });
      }
    }, pollingInterval);
  };

  // Initialize connections
  useEffect(() => {
    if (!user?._id) return;

    if (enableWebSocket) {
      connectWebSocket();
    } else {
      startPolling();
    }

    return () => {
      // Cleanup WebSocket
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }

      // Cleanup polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      // Cleanup reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [user?._id, enableWebSocket, pollingInterval]);

  // Manual reconnect function
  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttempts.current = 0;
    setConnectionError(null);
    
    if (enableWebSocket) {
      connectWebSocket();
    } else {
      startPolling();
    }
  };

  // Send message through WebSocket
  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  return {
    isConnected,
    connectionError,
    lastUpdate,
    reconnect,
    sendMessage,
    isWebSocketEnabled: enableWebSocket,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  };
};
