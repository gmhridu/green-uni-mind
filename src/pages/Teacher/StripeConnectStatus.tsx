import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useCheckStripeAccountStatusQuery, useRetryConnectionMutation } from '@/redux/features/payment/payment.api';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { toast } from 'sonner';

const StripeConnectStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const success = searchParams.get('success');
  const reason = searchParams.get('reason');
  const [isRetrying, setIsRetrying] = useState(false);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<Date | null>(null);

  // Get user data
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Enhanced polling logic for real-time updates
  const shouldPoll = success === 'true' && statusCheckCount < 12; // Poll for 1 minute max

  // Get account status with conditional polling
  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
    refetch
  } = useCheckStripeAccountStatusQuery(teacherId, {
    skip: !teacherId,
    pollingInterval: shouldPoll ? 5000 : 0,
  });

  const [retryConnection] = useRetryConnectionMutation();

  // Calculate connection progress based on status
  const calculateProgress = useCallback((status: any) => {
    if (!status) return 0;

    let progress = 0;
    if (status.isConnected) progress += 25;
    if (status.onboardingComplete) progress += 25;
    if (status.isVerified) progress += 25;
    if (status.canReceivePayments) progress += 25;

    return progress;
  }, []);

  // Update progress when status changes
  useEffect(() => {
    if (statusData?.data) {
      const newProgress = calculateProgress(statusData.data);
      setConnectionProgress(newProgress);
      setLastStatusUpdate(new Date());
    }
  }, [statusData, calculateProgress]);

  // Enhanced polling with exponential backoff
  useEffect(() => {
    if (success === 'true' && statusCheckCount < 12) {
      setIsPolling(true);
      const timer = setTimeout(() => {
        setStatusCheckCount(prev => prev + 1);
        refetch();
      }, Math.min(5000 + (statusCheckCount * 1000), 10000)); // Exponential backoff

      return () => {
        clearTimeout(timer);
        if (statusCheckCount >= 11) {
          setIsPolling(false);
        }
      };
    } else {
      setIsPolling(false);
    }
  }, [success, statusCheckCount, refetch]);

  const handleRetryConnection = async () => {
    try {
      setIsRetrying(true);
      await retryConnection({}).unwrap();
      toast.success('Connection reset successfully. You can now try connecting again.');
      navigate('/teacher/stripe-connect');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to retry connection');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/teacher/dashboard');
  };

  const handleGoToStripeConnect = () => {
    navigate('/teacher/stripe-connect');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'restricted':
        return <Badge className="bg-orange-100 text-orange-800">Restricted</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Not Connected</Badge>;
    }
  };

  const renderSuccessContent = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 animate-pulse">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Stripe Account Connected!
        </h1>
        <p className="text-lg text-gray-600">
          Your Stripe account has been successfully connected. We're verifying your account details...
        </p>
        {isPolling && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600">Live updates enabled</span>
          </div>
        )}
      </div>

      {/* Connection Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Setup Progress</span>
          <span className="font-medium text-gray-900">{connectionProgress}%</span>
        </div>
        <Progress value={connectionProgress} className="h-2" />
        <div className="text-xs text-gray-500">
          {connectionProgress === 100 ? 'Setup complete!' : 'Verification in progress...'}
        </div>
      </div>

      {statusLoading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600">Checking account status...</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mx-auto" />
          </div>
        </div>
      ) : statusError ? (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <p className="font-medium text-red-800 mb-1">Connection Error</p>
            <p className="text-sm text-red-700">
              Unable to check account status. Please refresh the page or try again.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="bg-gray-50 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Account Status</h3>
              {lastStatusUpdate && (
                <span className="text-xs text-gray-500 ml-auto">
                  Updated {lastStatusUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Connection</span>
                {getStatusBadge(statusData?.data?.status || 'pending')}
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Onboarding</span>
                <Badge className={statusData?.data?.onboardingComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {statusData?.data?.onboardingComplete ? 'Complete' : 'In Progress'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Verification</span>
                <Badge className={statusData?.data?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {statusData?.data?.isVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Payments</span>
                <Badge className={statusData?.data?.canReceivePayments ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {statusData?.data?.canReceivePayments ? 'Enabled' : 'Pending'}
                </Badge>
              </div>
            </div>

            {statusData?.data?.requirements?.currently_due?.length > 0 && (
              <div className="mt-4">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <p className="font-medium text-yellow-800 mb-1">Additional Information Required</p>
                    <p className="text-sm text-yellow-700 mb-2">
                      Complete these steps to finish your account setup:
                    </p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                      {statusData.data.requirements.currently_due.slice(0, 3).map((req: string, index: number) => (
                        <li key={index} className="capitalize">{req.replace(/_/g, ' ')}</li>
                      ))}
                      {statusData.data.requirements.currently_due.length > 3 && (
                        <li>And {statusData.data.requirements.currently_due.length - 3} more...</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={handleGoToStripeConnect} className="bg-blue-600 hover:bg-blue-700">
          View Stripe Dashboard
        </Button>
        <Button variant="outline" onClick={handleBackToDashboard}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );

  const renderFailureContent = () => {
    const getFailureDetails = () => {
      switch (reason) {
        case 'refresh':
          return {
            title: 'Session Expired',
            description: 'Your onboarding session timed out for security reasons.',
            details: 'This is normal behavior. Stripe sessions expire after 24 hours of inactivity to protect your account.',
            actionText: 'Start New Session',
            severity: 'warning'
          };
        case 'error':
          return {
            title: 'Connection Error',
            description: 'There was a technical issue during the connection process.',
            details: 'This can happen due to network connectivity issues or temporary service disruptions.',
            actionText: 'Retry Connection',
            severity: 'error'
          };
        default:
          return {
            title: 'Connection Failed',
            description: 'The Stripe account connection was not completed.',
            details: 'This can happen if the onboarding process was interrupted or cancelled.',
            actionText: 'Try Again',
            severity: 'error'
          };
      }
    };

    const failureDetails = getFailureDetails();

    return (
      <div className="text-center space-y-6">
        <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${
          failureDetails.severity === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
          {failureDetails.severity === 'warning' ? (
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          ) : (
            <XCircle className="h-10 w-10 text-red-600" />
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {failureDetails.title}
          </h1>
          <p className="text-lg text-gray-600">
            {failureDetails.description}
          </p>
        </div>

        <Alert className={`${
          failureDetails.severity === 'warning'
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <AlertCircle className={`h-4 w-4 ${
            failureDetails.severity === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`} />
          <AlertDescription>
            <p className={`font-medium mb-1 ${
              failureDetails.severity === 'warning' ? 'text-yellow-800' : 'text-red-800'
            }`}>
              What happened?
            </p>
            <p className={`text-sm ${
              failureDetails.severity === 'warning' ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {failureDetails.details}
            </p>
          </AlertDescription>
        </Alert>

        {/* Troubleshooting steps */}
        <Card className="bg-gray-50 text-left">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">1</div>
                <span>Click "{failureDetails.actionText}" to reset your connection status</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">2</div>
                <span>You'll be redirected to start a fresh Stripe onboarding session</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mt-0.5">3</div>
                <span>Complete the verification process in one session to avoid timeouts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleRetryConnection}
            disabled={isRetrying}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Resetting Connection...
              </>
            ) : (
              failureDetails.actionText
            )}
          </Button>

          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Additional help */}
        <div className="text-sm text-gray-500">
          <p>Still having issues? Contact support for assistance.</p>
        </div>
      </div>
    );
  };

  const renderDefaultContent = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100">
        <AlertCircle className="h-10 w-10 text-blue-600" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Stripe Connect Status
        </h1>
        <p className="text-lg text-gray-600">
          Check your Stripe account connection status and manage your payment settings.
        </p>
      </div>

      {statusLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600">Loading account status...</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mx-auto" />
          </div>
        </div>
      ) : statusError ? (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <p className="font-medium text-red-800 mb-1">Unable to Load Status</p>
            <p className="text-sm text-red-700">
              There was an error loading your account status. Please check your connection and try again.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="bg-gray-50 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Current Status
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Connection</span>
                {getStatusBadge(statusData?.data?.status || 'not_connected')}
              </div>
              {statusData?.data?.isConnected && (
                <>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Verification</span>
                    <Badge className={statusData?.data?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {statusData?.data?.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Payments</span>
                    <Badge className={statusData?.data?.canReceivePayments ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {statusData?.data?.canReceivePayments ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Onboarding</span>
                    <Badge className={statusData?.data?.onboardingComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {statusData?.data?.onboardingComplete ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {statusData?.data?.status === 'not_connected' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-1">Ready to Get Started?</p>
                <p className="text-sm text-blue-700">
                  Connect your Stripe account to start receiving payments from students.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={handleGoToStripeConnect} className="bg-blue-600 hover:bg-blue-700">
          {statusData?.data?.isConnected ? 'Manage Stripe Account' : 'Connect Stripe Account'}
        </Button>
        <Button variant="outline" onClick={handleBackToDashboard}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );

  // Error boundary fallback
  if (statusError && !statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Connection Error
                </h1>
                <p className="text-gray-600">
                  Unable to load your Stripe account status. Please check your connection and try again.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
                <Button variant="outline" onClick={handleBackToDashboard}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {success === 'true' && renderSuccessContent()}
            {success === 'false' && renderFailureContent()}
            {!success && renderDefaultContent()}
          </CardContent>
        </Card>

        {/* Status indicator */}
        {isPolling && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm">Live updates active</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripeConnectStatus;
