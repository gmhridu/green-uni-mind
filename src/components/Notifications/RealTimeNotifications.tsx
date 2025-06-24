import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  DollarSign,
  Wallet,
  Clock,
  X,
  Check,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRealTimePaymentTracking } from '@/hooks/useRealTimePaymentTracking';
import { PaymentNotification } from '@/services/realTimePaymentService';
import { cn } from '@/lib/utils';

interface RealTimeNotificationsProps {
  className?: string;
  showConnectionStatus?: boolean;
  maxNotifications?: number;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  className,
  showConnectionStatus = true,
  maxNotifications = 10
}) => {
  const {
    isConnected,
    isReconnecting,
    connectionError,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    retryConnection
  } = useRealTimePaymentTracking();

  const [showAll, setShowAll] = useState(false);

  const displayedNotifications = showAll 
    ? notifications 
    : notifications.slice(0, maxNotifications);

  const getNotificationIcon = (type: PaymentNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: PaymentNotification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getPaymentIcon = (data: any) => {
    if (data?.type === 'payout_processed') {
      return <Wallet className="w-4 h-4" />;
    }
    return <DollarSign className="w-4 h-4" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <Card className={cn(
          "border-2",
          isConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    isConnected ? "text-green-800" : "text-red-800"
                  )}>
                    {isConnected ? 'Real-time Updates Active' : 'Connection Lost'}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isConnected ? "text-green-600" : "text-red-600"
                  )}>
                    {isConnected 
                      ? 'You\'ll receive instant payment notifications'
                      : isReconnecting 
                        ? 'Attempting to reconnect...'
                        : connectionError || 'Unable to connect to real-time service'
                    }
                  </p>
                </div>
              </div>
              
              {!isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryConnection}
                  disabled={isReconnecting}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isReconnecting && "animate-spin")} />
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Payment Notifications
              </CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllNotificationsAsRead}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark All Read
                </Button>
              )}
              
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearNotifications}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {displayedNotifications.length > 0 ? (
            <div className="space-y-3">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 border rounded-lg transition-all duration-200",
                    getNotificationColor(notification.type),
                    !notification.read && "ring-2 ring-blue-200 ring-opacity-50"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          {notification.data && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              {getPaymentIcon(notification.data)}
                              {notification.data.amount && (
                                <span>${notification.data.amount.toFixed(2)}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.timestamp)}
                          </div>
                          
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        
                        {notification.actionUrl && notification.actionText && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs mt-2"
                            asChild
                          >
                            <a href={notification.actionUrl}>
                              {notification.actionText}
                            </a>
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {notifications.length > maxNotifications && !showAll && (
                <div className="text-center pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    className="text-xs"
                  >
                    Show {notifications.length - maxNotifications} more notifications
                  </Button>
                </div>
              )}
              
              {showAll && notifications.length > maxNotifications && (
                <div className="text-center pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(false)}
                    className="text-xs"
                  >
                    Show less
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 text-sm">
                {isConnected 
                  ? "You'll receive real-time notifications for payments and payouts here"
                  : "Connect to receive real-time payment notifications"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {notifications.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success</p>
                  <p className="text-lg font-bold text-green-600">
                    {notifications.filter(n => n.type === 'success').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-lg font-bold text-red-600">
                    {notifications.filter(n => n.type === 'error').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;
