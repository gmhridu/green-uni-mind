import React from 'react';
import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  connectionError?: string | null;
  lastUpdate?: Date | null;
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
  onReconnect?: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionState,
  connectionError,
  lastUpdate,
  reconnectAttempts = 0,
  maxReconnectAttempts = 5,
  onReconnect,
  className
}) => {
  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <RotateCcw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
      default:
        return connectionError ? 
          <AlertCircle className="h-4 w-4 text-red-500" /> : 
          <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Real-time updates active';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;
      case 'disconnected':
      default:
        return connectionError || 'Real-time updates offline';
    }
  };

  const getStatusVariant = () => {
    switch (connectionState) {
      case 'connected':
        return 'default' as const;
      case 'connecting':
      case 'reconnecting':
        return 'secondary' as const;
      case 'disconnected':
      default:
        return connectionError ? 'destructive' as const : 'outline' as const;
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return lastUpdate.toLocaleDateString();
  };

  const shouldShowReconnectButton = connectionState === 'disconnected' && 
    reconnectAttempts < maxReconnectAttempts && 
    onReconnect;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={getStatusVariant()}
              className="flex items-center gap-1.5 px-2 py-1"
            >
              {getStatusIcon()}
              <span className="text-xs font-medium">
                {getStatusText()}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Real-time Connection Status</p>
              <p className="text-xs text-muted-foreground">
                Status: {connectionState}
              </p>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground">
                  Last update: {formatLastUpdate()}
                </p>
              )}
              {connectionError && (
                <p className="text-xs text-red-400">
                  Error: {connectionError}
                </p>
              )}
              {reconnectAttempts > 0 && (
                <p className="text-xs text-muted-foreground">
                  Reconnect attempts: {reconnectAttempts}/{maxReconnectAttempts}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {shouldShowReconnectButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReconnect}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};

// Enterprise-level connection status for dashboard header
export const DashboardConnectionStatus: React.FC<{
  realTimeHook: {
    isConnected: boolean;
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
    connectionError?: string | null;
    lastUpdate?: Date | null;
    reconnectAttempts?: number;
    maxReconnectAttempts?: number;
    reconnect?: () => void;
  };
}> = ({ realTimeHook }) => {
  return (
    <ConnectionStatus
      isConnected={realTimeHook.isConnected}
      connectionState={realTimeHook.connectionState}
      connectionError={realTimeHook.connectionError}
      lastUpdate={realTimeHook.lastUpdate}
      reconnectAttempts={realTimeHook.reconnectAttempts}
      maxReconnectAttempts={realTimeHook.maxReconnectAttempts}
      onReconnect={realTimeHook.reconnect}
      className="ml-auto"
    />
  );
};
