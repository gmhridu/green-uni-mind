import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import {
  useConnectStripeAccountMutation,
  useGetTeacherEarningsQuery,
} from "@/redux/features/payment/payment.api";
import { toast } from "sonner";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useNavigate } from "react-router-dom";

const Earnings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripeStatus = searchParams.get("status");
  const { data: userData, refetch: refetchUser, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const user = userData?.data;
  const [connectStripeAccount, { isLoading: isConnecting }] =
    useConnectStripeAccountMutation();
  const { data: earningsData, refetch, isLoading: isEarningsLoading } = useGetTeacherEarningsQuery(
    user?.id || "",
    {
      skip: !user?.id,
    }
  );

  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "warning" | "error">("warning");
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Handle URL status parameters
  useEffect(() => {
    if (stripeStatus) {
      if (stripeStatus === "complete") {
        setStatusMessage("Your Stripe account setup is complete! You can now receive payments.");
        setStatusType("success");
        setShowStatusAlert(true);
        // Clear the status parameter from URL
        navigate("/teacher/earnings", { replace: true });
        refetch();
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
        refetch();
        refetchUser();
      }
    } else {
      // If no status in URL and not actively polling, don't show status alert on initial load
      if (!isPolling && !showStatusAlert) {
        setShowStatusAlert(false);
      }
    }
  }, [stripeStatus, navigate, refetch, refetchUser, isPolling, showStatusAlert]);

  // Track previous Stripe verification status
  const [prevStripeVerified, setPrevStripeVerified] = useState<boolean | undefined>(undefined);

  // Update previous status when user data changes
  useEffect(() => {
    if (user && prevStripeVerified === undefined) {
      // Initialize on first load
      setPrevStripeVerified(user.stripeVerified);
    }
  }, [user, prevStripeVerified]);

  // Polling mechanism to check for Stripe status updates
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    if (isPolling && !user?.stripeVerified && pollCount < 10) {
      // Poll every 3 seconds, up to 10 times (30 seconds total)
      pollingInterval = setInterval(() => {
        console.log("Polling for Stripe status update...", pollCount + 1);
        refetchUser();
        setPollCount(prev => prev + 1);
      }, 3000);
    }

    // If user is verified or we've reached max poll count, stop polling
    if ((user?.stripeVerified && isPolling) || pollCount >= 10) {
      setIsPolling(false);

      // Only show success message if status changed from not verified to verified
      if (user?.stripeVerified && prevStripeVerified === false) {
        setStatusMessage("Your Stripe account is now connected!");
        setStatusType("success");
        setShowStatusAlert(true);
        toast.success("Stripe account connected successfully!");
        setPrevStripeVerified(true);

        // Auto-hide the alert after 5 seconds
        const timer = setTimeout(() => {
          setShowStatusAlert(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [isPolling, user?.stripeVerified, pollCount, refetchUser, prevStripeVerified]);

  const handleConnectStripe = async () => {
    try {
      const result = await connectStripeAccount(user?.id || "").unwrap();
      if (result?.data?.url) {
        // Open Stripe onboarding in a new tab
        window.open(result.data.url, "_blank");
        toast.info("Completing your Stripe setup in a new tab. Please complete all steps.");

        // Start polling for status updates
        setIsPolling(true);
        setPollCount(0);
        // Set the previous status to false to track the change
        setPrevStripeVerified(false);
        toast.info("We'll check for updates automatically when you complete the Stripe setup.");
      } else if (result?.status === "complete") {
        toast.success("Your Stripe account is already set up and verified!");
        refetchUser(); // Refresh user data to update UI
      }
    } catch (error: unknown) {
      const err = error as {
        data?: { message?: string };
        status?: number;
      };

      console.error("Stripe connection error:", error);

      if (err?.data?.message?.includes("Stripe Connect")) {
        toast.error(
          "Please contact support to enable Stripe Connect for your account"
        );
      } else if (err?.data?.message?.includes("Not a valid URL")) {
        toast.error(
          "Invalid frontend URL configuration. Please contact support."
        );
      } else {
        toast.error(err?.data?.message || "Failed to connect Stripe account");
      }
    }
  };

  const earningStats = [
    {
      label: "Total Earnings",
      value: `$${earningsData?.data?.totalEarnings?.toFixed(2) || "0.00"}`,
    },
    {
      label: "This Month",
      value: `$${earningsData?.data?.monthlyEarnings?.toFixed(2) || "0.00"}`,
    },
    {
      label: "Pending Payout",
      value: `$${earningsData?.data?.weeklyEarnings?.toFixed(2) || "0.00"}`,
    },
    {
      label: "Lifetime Students",
      value: earningsData?.data?.enrolledStudents || "0",
    },
  ];

  const transactionHistory = [
    {
      id: 1,
      date: "2023-05-15",
      course: "Introduction to React",
      amount: "$29.99",
      status: "completed",
    },
    {
      id: 2,
      date: "2023-05-14",
      course: "Introduction to React",
      amount: "$29.99",
      status: "completed",
    },
    {
      id: 3,
      date: "2023-05-12",
      course: "Advanced TypeScript Patterns",
      amount: "$49.99",
      status: "completed",
    },
    {
      id: 4,
      date: "2023-05-10",
      course: "Full Stack Development with Node.js",
      amount: "$59.99",
      status: "completed",
    },
    {
      id: 5,
      date: "2023-05-08",
      course: "Introduction to React",
      amount: "$29.99",
      status: "completed",
    },
    {
      id: 6,
      date: "2023-05-05",
      course: "Python for Data Science",
      amount: "$39.99",
      status: "completed",
    },
    {
      id: 7,
      date: "2023-05-03",
      course: "Advanced TypeScript Patterns",
      amount: "$49.99",
      status: "pending",
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Earnings</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {isUserLoading ? (
            <Button disabled className="flex items-center gap-2 w-full sm:w-auto">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </Button>
          ) : user?.stripeVerified ? (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border-green-200 w-full sm:w-auto justify-center">
              <CheckCircle className="h-4 w-4" />
              <span>Stripe Connected</span>
            </Badge>
          ) : (
            <Button
              onClick={handleConnectStripe}
              disabled={isConnecting}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>Connect with Stripe</span>
                </>
              )}
            </Button>
          )}
        </div>
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

      {/* Polling Status Alert */}
      {isPolling && (
        <Alert className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Checking Stripe Status</AlertTitle>
          <AlertDescription>
            We're checking for updates to your Stripe account status. This will happen automatically when you complete the Stripe setup.
          </AlertDescription>
        </Alert>
      )}

      {/* Stripe Requirements Alert */}
      {user?.stripeRequirements && user.stripeRequirements.length > 0 && (
        <Alert variant="destructive" className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Stripe Account Requires Attention</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Please complete the following requirements in your Stripe account:</p>
            <ul className="list-disc pl-5">
              {user.stripeRequirements.map((req: string, index: number) => (
                <li key={index}>{req.replace(/_/g, ' ')}</li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleConnectStripe}
            >
              Complete Requirements
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {earningStats.map((stat, index) => (
          <Card key={index} className="stats-card">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-500">
                {stat.label}
              </h3>
              <p className="text-xl sm:text-2xl font-bold mt-2">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Transaction History</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                This Month <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full sm:w-auto">
              <DropdownMenuItem>This Month</DropdownMenuItem>
              <DropdownMenuItem>Last Month</DropdownMenuItem>
              <DropdownMenuItem>Last 3 Months</DropdownMenuItem>
              <DropdownMenuItem>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Course
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">{transaction.date}</td>
                      <td className="py-3 px-4">{transaction.course}</td>
                      <td className="py-3 px-4 text-right">
                        {transaction.amount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {transaction.status === "completed"
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
              <span className="text-sm font-medium">Payout Method</span>
              <span className="text-sm">Stripe</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
              <span className="text-sm font-medium">Next Payout Date</span>
              <span className="text-sm">June 1, 2023</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-sm font-medium">Payout Schedule</span>
              <span className="text-sm">Monthly</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Earnings;
