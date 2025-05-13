import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart3, FileDown, LineChart, Loader2 } from "lucide-react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import our components
import StripeConnectBanner from "@/components/Teacher/StripeConnectBanner";
import EarningsSummary from "@/components/Teacher/EarningsSummary";
import TransactionTable from "@/components/Teacher/TransactionTable";
import PayoutHistory from "@/components/Teacher/PayoutHistory";
import PayoutPreferences from "@/components/Teacher/PayoutPreferences";
import UpcomingPayout from "@/components/Teacher/UpcomingPayout";

const Earnings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripeStatus = searchParams.get("status");
  const { data: userData, refetch: refetchUser, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const user = userData?.data;

  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "warning" | "error">("warning");

  // Log user data for debugging
  useEffect(() => {
    if (userData) {
      console.log("User data in Earnings component:", userData);
    }
  }, [userData]);

  // Handle URL status parameters
  useEffect(() => {
    if (stripeStatus) {
      console.log("Stripe status from URL:", stripeStatus);

      if (stripeStatus === "complete") {
        setStatusMessage("Your Stripe account setup is complete! You can now receive payments.");
        setStatusType("success");
        setShowStatusAlert(true);

        // Clear the status parameter from URL
        navigate("/teacher/earnings", { replace: true });

        // Force refresh user data
        refetchUser();

        // Auto-hide the alert after 5 seconds
        const timer = setTimeout(() => {
          setShowStatusAlert(false);
        }, 5000);

        return () => clearTimeout(timer);
      } else if (stripeStatus === "incomplete") {
        setStatusMessage("Your Stripe account setup is incomplete. Please complete all requirements to receive payments.");
        setStatusType("warning");
        setShowStatusAlert(true);

        // Clear the status parameter from URL
        navigate("/teacher/earnings", { replace: true });

        // Force refresh user data
        refetchUser();
      }
    }
  }, [stripeStatus, navigate, refetchUser]);

  // Loading state
  const isLoading = isUserLoading;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-48 sm:w-64" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Earnings Dashboard</h1>
            <div className="flex gap-2">
              <Link to="/teacher/earnings/report">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Detailed Report</span>
                  <span className="sm:hidden">Report</span>
                </Button>
              </Link>
              <Link to="/teacher/earnings/analytics">
                <Button variant="outline" className="gap-2">
                  <LineChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Analytics</span>
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Stripe Status Alert */}
      {showStatusAlert && (
        <Alert variant={statusType === "success" ? "default" : "destructive"} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {statusType === "success" ? "Success" : "Action Required"}
          </AlertTitle>
          <AlertDescription>
            {statusMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Stripe Connect Banner */}
      {user && <StripeConnectBanner teacherId={user.id} />}

      {isLoading ? (
        <div className="space-y-6 mt-6">
          {/* Skeleton for Stripe Connect Banner */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-full max-w-[280px] mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-28" />
              </div>
            </CardContent>
          </Card>

          {/* Skeleton for Tabs */}
          <div className="border-b border-muted/30 w-full">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-t" />
              <Skeleton className="h-10 w-28 rounded-t opacity-70" />
            </div>
          </div>

          {/* Skeleton for Earnings Summary Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            {[1, 2, 3, 4].map((index) => (
              <Card key={index} className="border border-muted/30 overflow-hidden">
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skeleton for Chart */}
          <Card className="mt-6">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {user && (
              <>
                <UpcomingPayout teacherId={user.id} />
                <EarningsSummary teacherId={user.id} />
              </>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6 mt-6">
            {user && <TransactionTable teacherId={user.id} />}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6 mt-6">
            {user && <PayoutHistory teacherId={user.id} />}
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 mt-6">
            {user && <PayoutPreferences teacherId={user.id} />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Earnings;