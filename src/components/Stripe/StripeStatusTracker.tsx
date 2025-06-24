import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Shield,
  CreditCard,
  Building,
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StripeStatusTrackerProps {
  stripeStatus?: {
    isConnected: boolean;
    isVerified: boolean;
    onboardingComplete: boolean;
    requirements?: string[];
    accountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
  };
  isLoading?: boolean;
  onRefresh: () => void;
  onCompleteSetup: () => void;
  className?: string;
}

const StripeStatusTracker: React.FC<StripeStatusTrackerProps> = ({
  stripeStatus,
  isLoading = false,
  onRefresh,
  onCompleteSetup,
  className
}) => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdated(new Date());
  }, [stripeStatus]);

  const getOverallProgress = () => {
    let progress = 0;
    if (stripeStatus?.isConnected) progress += 25;
    if (stripeStatus?.detailsSubmitted) progress += 25;
    if (stripeStatus?.isVerified) progress += 25;
    if (stripeStatus?.onboardingComplete) progress += 25;
    return progress;
  };

  const getOverallStatus = () => {
    if (!stripeStatus?.isConnected) {
      return {
        status: 'not_started',
        title: 'Not Connected',
        description: 'Connect your Stripe account to start receiving payments',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }

    if (stripeStatus.requirements && stripeStatus.requirements.length > 0) {
      return {
        status: 'action_required',
        title: 'Action Required',
        description: 'Complete the required information to activate your account',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }

    if (!stripeStatus.onboardingComplete) {
      return {
        status: 'in_progress',
        title: 'Setup In Progress',
        description: 'Your account setup is being processed',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }

    if (!stripeStatus.isVerified) {
      return {
        status: 'pending_verification',
        title: 'Pending Verification',
        description: 'Your account is under review by Stripe',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }

    return {
      status: 'active',
      title: 'Active & Verified',
      description: 'Your account is ready to receive payments',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const statusInfo = getOverallStatus();

  const statusChecks = [
    {
      id: 'connected',
      title: 'Account Connected',
      description: 'Stripe account linked to your profile',
      icon: CreditCard,
      status: stripeStatus?.isConnected ? 'complete' : 'pending',
      required: true
    },
    {
      id: 'details',
      title: 'Details Submitted',
      description: 'Business and personal information provided',
      icon: FileText,
      status: stripeStatus?.detailsSubmitted ? 'complete' : stripeStatus?.isConnected ? 'pending' : 'disabled',
      required: true
    },
    {
      id: 'verification',
      title: 'Identity Verified',
      description: 'Identity and business verification completed',
      icon: Shield,
      status: stripeStatus?.isVerified ? 'complete' : stripeStatus?.detailsSubmitted ? 'pending' : 'disabled',
      required: true
    },
    {
      id: 'capabilities',
      title: 'Payment Capabilities',
      description: 'Charges and payouts enabled',
      icon: Building,
      status: (stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled) ? 'complete' : 
              stripeStatus?.isVerified ? 'pending' : 'disabled',
      required: true
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'disabled':
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'disabled':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className={cn("stripe-status-tracker", statusInfo.borderColor, className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Stripe Account Status
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={statusInfo.status === 'active' ? 'default' : 'secondary'}
                className={cn("text-xs", statusInfo.color)}
              >
                {statusInfo.title}
              </Badge>
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Setup Progress</span>
            <span className="text-gray-600">{getOverallProgress()}% Complete</span>
          </div>
          <Progress value={getOverallProgress()} className="h-2" />
          <p className="text-sm text-gray-600">{statusInfo.description}</p>
        </div>

        {/* Status Checks */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Setup Requirements</h4>
          {statusChecks.map((check) => {
            const CheckIcon = check.icon;
            return (
              <div
                key={check.id}
                className={cn(
                  "flex items-center gap-4 p-3 border rounded-lg transition-colors",
                  getStatusColor(check.status)
                )}
              >
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    check.status === 'complete' ? 'bg-green-100' :
                    check.status === 'pending' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  )}>
                    <CheckIcon className={cn(
                      "w-5 h-5",
                      check.status === 'complete' ? 'text-green-600' :
                      check.status === 'pending' ? 'text-yellow-600' :
                      'text-gray-400'
                    )} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900">{check.title}</h5>
                    {check.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{check.description}</p>
                </div>
                
                <div className="flex-shrink-0">
                  {getStatusIcon(check.status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Requirements Alert */}
        {stripeStatus?.requirements && stripeStatus.requirements.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-yellow-800">Action Required</p>
                <p className="text-sm text-yellow-700">
                  Complete the following requirements to activate your account:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                  {stripeStatus.requirements.map((requirement, index) => (
                    <li key={index} className="list-disc">{requirement}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          {statusInfo.status === 'not_started' && (
            <Button onClick={onCompleteSetup} className="flex-1">
              <CreditCard className="w-4 h-4 mr-2" />
              Connect Stripe Account
            </Button>
          )}
          
          {(statusInfo.status === 'action_required' || statusInfo.status === 'in_progress') && (
            <Button onClick={onCompleteSetup} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Complete Setup
            </Button>
          )}
          
          {statusInfo.status === 'active' && (
            <div className="flex items-center gap-2 text-sm text-green-600 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>Your account is ready to receive payments!</span>
            </div>
          )}
        </div>

        {/* Account Info */}
        {stripeStatus?.accountId && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Account ID: {stripeStatus.accountId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeStatusTracker;
