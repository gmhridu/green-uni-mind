import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Calendar,
  User,
  BookOpen,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { usePaymentTracking, usePaymentConnectionStatus } from '@/hooks/useRealTimePaymentTracking';
import { cn } from '@/lib/utils';

interface PaymentStatusTrackerProps {
  transactionId: string;
  initialStatus?: string;
  amount?: number;
  courseTitle?: string;
  studentName?: string;
  createdAt?: string;
  onStatusChange?: (status: string) => void;
  showDetails?: boolean;
  className?: string;
}

const PaymentStatusTracker: React.FC<PaymentStatusTrackerProps> = ({
  transactionId,
  initialStatus = 'pending',
  amount,
  courseTitle,
  studentName,
  createdAt,
  onStatusChange,
  showDetails = true,
  className
}) => {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [statusHistory, setStatusHistory] = useState<Array<{
    status: string;
    timestamp: Date;
    message?: string;
  }>>([
    { status: initialStatus, timestamp: new Date(), message: 'Payment initiated' }
  ]);

  const paymentTracking = usePaymentTracking(transactionId);
  const { connected: isConnected, retryConnection } = usePaymentConnectionStatus();

  // Update status when real-time update is received
  useEffect(() => {
    if (paymentTracking.status && paymentTracking.status !== currentStatus) {
      setCurrentStatus(paymentTracking.status);
      
      if (paymentTracking.lastUpdate) {
        setStatusHistory(prev => [
          ...prev,
          {
            status: paymentTracking.status!,
            timestamp: paymentTracking.lastUpdate!,
            message: getStatusMessage(paymentTracking.status!)
          }
        ]);
      }

      onStatusChange?.(paymentTracking.status);
    }
  }, [paymentTracking.status, paymentTracking.lastUpdate, currentStatus, onStatusChange]);

  const getStatusMessage = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Payment is being processed';
      case 'processing':
        return 'Payment is being verified';
      case 'completed':
      case 'success':
        return 'Payment completed successfully';
      case 'failed':
        return 'Payment failed to process';
      case 'cancelled':
        return 'Payment was cancelled';
      case 'refunded':
        return 'Payment has been refunded';
      default:
        return `Payment status: ${status}`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      case 'refunded':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressValue = (status: string): number => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 25;
      case 'processing':
        return 50;
      case 'completed':
      case 'success':
        return 100;
      case 'failed':
      case 'cancelled':
        return 0;
      case 'refunded':
        return 75;
      default:
        return 25;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSuccessful = ['completed', 'success'].includes(currentStatus.toLowerCase());
  const isFailed = ['failed', 'cancelled'].includes(currentStatus.toLowerCase());
  const isProcessing = ['pending', 'processing'].includes(currentStatus.toLowerCase());

  return (
    <Card className={cn("payment-status-tracker", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Payment Status
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Connection indicator */}
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs text-gray-500">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            {!isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={retryConnection}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(currentStatus)}
            <div>
              <Badge className={cn("text-sm border", getStatusColor(currentStatus))}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">
                {getStatusMessage(currentStatus)}
              </p>
            </div>
          </div>
          
          {paymentTracking.lastUpdate && (
            <div className="text-right text-xs text-gray-500">
              Last updated: {formatDate(paymentTracking.lastUpdate)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{getProgressValue(currentStatus)}%</span>
          </div>
          <Progress 
            value={getProgressValue(currentStatus)} 
            className={cn(
              "h-2",
              isSuccessful && "bg-green-100",
              isFailed && "bg-red-100"
            )}
          />
        </div>

        {/* Error Message */}
        {paymentTracking.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {paymentTracking.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Details */}
        {showDetails && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Payment Details</h4>
            
            <div className="grid gap-3 md:grid-cols-2">
              {amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              )}
              
              {courseTitle && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Course:</span>
                  <span className="font-medium truncate">{courseTitle}</span>
                </div>
              )}
              
              {studentName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Student:</span>
                  <span className="font-medium">{studentName}</span>
                </div>
              )}
              
              {createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(createdAt)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Transaction ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{transactionId}</code>
            </div>
          </div>
        )}

        {/* Status History */}
        {statusHistory.length > 1 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Status History</h4>
            <div className="space-y-2">
              {statusHistory.slice().reverse().map((entry, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.status}
                      </Badge>
                      <span className="text-gray-600">{entry.message}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(entry.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isSuccessful && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View Receipt
            </Button>
          </div>
        )}

        {isFailed && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p><strong>Payment Failed</strong></p>
                <p className="text-sm">
                  The payment could not be processed. Please try again or contact support if the issue persists.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">
                    Retry Payment
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time indicator */}
        {isProcessing && isConnected && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Monitoring payment status in real-time...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusTracker;
