import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  DollarSign,
  TrendingUp,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import RealTimeNotifications from '@/components/Notifications/RealTimeNotifications';
import PaymentStatusTracker from '@/components/Payment/PaymentStatusTracker';
import { useRealTimePaymentTracking, useEarningsTracking } from '@/hooks/useRealTimePaymentTracking';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import {
  useGetTeacherEarningsQuery,
  useGetTeacherTransactionsQuery,
  useCheckStripeAccountStatusQuery
} from '@/redux/features/payment/payment.api';
import { cn } from '@/lib/utils';

const RealTimePaymentDashboard: React.FC = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;
  
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time tracking hooks
  const {
    isConnected,
    isReconnecting,
    connectionError,
    notifications,
    unreadCount,
    recentPayments,
    recentPayouts,
    retryConnection
  } = useRealTimePaymentTracking();

  const earningsUpdate = useEarningsTracking();

  // Get Stripe account status
  const { data: stripeStatus } = useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });

  // Get earnings and transactions data
  const {
    data: earningsData,
    isLoading: isEarningsLoading,
    refetch: refetchEarnings
  } = useGetTeacherEarningsQuery(teacherId, { skip: !teacherId });

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useGetTeacherTransactionsQuery({ teacherId, period: '7d' }, { skip: !teacherId });

  const isStripeConnected = stripeStatus?.data?.isConnected;
  const isStripeVerified = stripeStatus?.data?.isVerified;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRefresh = () => {
    refetchEarnings();
    refetchTransactions();
  };

  // Calculate real-time stats
  const realtimeStats = {
    totalEarnings: earningsData?.data?.total || 0,
    todayEarnings: earningsUpdate.amount || earningsData?.data?.daily || 0,
    recentTransactions: transactionsData?.data?.length || 0,
    successfulPayments: recentPayments.filter(p => p.type === 'payment_completed').length,
    failedPayments: recentPayments.filter(p => p.type === 'payment_failed').length,
  };

  // Show setup message if Stripe is not connected
  if (!isStripeConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-time Payment Dashboard</h1>
              <p className="text-lg text-gray-600">
                Monitor your payments and earnings in real-time
              </p>
            </div>

            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Stripe account to start monitoring real-time payment activity.
              </AlertDescription>
            </Alert>

            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/teacher/stripe-connect">
                <Activity className="w-4 h-4 mr-2" />
                Connect Stripe Account
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real-time Payment Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor your payments, earnings, and notifications in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
              isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{isConnected ? 'Live Updates' : 'Disconnected'}</span>
            </div>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isEarningsLoading || isTransactionsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", (isEarningsLoading || isTransactionsLoading) && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stripe Status Alert */}
        {isStripeConnected && !isStripeVerified && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-yellow-800">
                  Your Stripe account is connected but pending verification. Real-time tracking may be limited.
                </span>
                <Button variant="outline" size="sm" asChild>
                  <a href="/teacher/stripe-connect">
                    Complete Setup
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Error Alert */}
        {!isConnected && connectionError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-800 font-medium">Connection Error</p>
                  <p className="text-red-700 text-sm">{connectionError}</p>
                  {isReconnecting && (
                    <p className="text-red-600 text-xs mt-1">Attempting to reconnect...</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryConnection}
                  disabled={isReconnecting}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isReconnecting && "animate-spin")} />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-800">
                    {formatCurrency(realtimeStats.totalEarnings)}
                  </p>
                  {earningsUpdate.lastUpdate && (
                    <p className="text-xs text-green-600">
                      Updated {earningsUpdate.lastUpdate.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Today's Earnings</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {formatCurrency(realtimeStats.todayEarnings)}
                  </p>
                  <p className="text-xs text-blue-600">Live tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">Successful Payments</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {realtimeStats.successfulPayments}
                  </p>
                  <p className="text-xs text-purple-600">Last 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-orange-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-700">Notifications</p>
                  <p className="text-2xl font-bold text-orange-800">{unreadCount}</p>
                  <p className="text-xs text-orange-600">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="ml-1 w-5 h-5 text-xs bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Live Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPayments.length > 0 || recentPayouts.length > 0 ? (
                    <div className="space-y-3">
                      {[...recentPayments, ...recentPayouts]
                        .sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime())
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              {activity.type === 'payment_completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : activity.type === 'payment_failed' ? (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              ) : (
                                <DollarSign className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {activity.type === 'payment_completed' ? 'Payment Received' :
                                 activity.type === 'payment_failed' ? 'Payment Failed' :
                                 activity.type === 'payout_processed' ? 'Payout Processed' :
                                 'Payment Update'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {activity.data.amount && `$${activity.data.amount.toFixed(2)} • `}
                                {new Date(activity.data.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No recent activity</p>
                      <p className="text-sm">Real-time updates will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isConnected ? (
                      <Wifi className="w-5 h-5 text-green-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-600" />
                    )}
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={cn(
                      "flex items-center gap-3 p-4 rounded-lg",
                      isConnected ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                    )}>
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        isConnected ? "bg-green-500" : "bg-red-500"
                      )} />
                      <div>
                        <p className={cn(
                          "font-medium",
                          isConnected ? "text-green-800" : "text-red-800"
                        )}>
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </p>
                        <p className={cn(
                          "text-sm",
                          isConnected ? "text-green-600" : "text-red-600"
                        )}>
                          {isConnected 
                            ? 'Receiving real-time updates'
                            : isReconnecting 
                              ? 'Attempting to reconnect...'
                              : 'Unable to connect to real-time service'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={cn(
                          "font-medium",
                          isConnected ? "text-green-600" : "text-red-600"
                        )}>
                          {isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Notifications:</span>
                        <span className="font-medium">{notifications.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unread:</span>
                        <span className="font-medium text-orange-600">{unreadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Updates:</span>
                        <span className="font-medium">{recentPayments.length + recentPayouts.length}</span>
                      </div>
                    </div>

                    {!isConnected && (
                      <Button
                        onClick={retryConnection}
                        disabled={isReconnecting}
                        className="w-full"
                      >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isReconnecting && "animate-spin")} />
                        {isReconnecting ? 'Reconnecting...' : 'Retry Connection'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <RealTimeNotifications showConnectionStatus={false} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="space-y-4">
              {transactionsData?.data?.slice(0, 5).map((transaction: any) => (
                <PaymentStatusTracker
                  key={transaction._id}
                  transactionId={transaction._id}
                  initialStatus={transaction.status}
                  amount={transaction.totalAmount}
                  courseTitle={transaction.courseId?.title}
                  studentName={`${transaction.studentId?.name?.firstName} ${transaction.studentId?.name?.lastName}`}
                  createdAt={transaction.createdAt}
                />
              )) || (
                <Card>
                  <CardContent className="p-12">
                    <div className="text-center">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recent Transactions</h3>
                      <p className="text-gray-600">
                        Transaction tracking will appear here when students make purchases
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">
                    Real-time payment analytics and insights will be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RealTimePaymentDashboard;
