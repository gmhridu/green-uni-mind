import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  useConnectStripeAccountMutation,
  useGetTeacherEarningsQuery,
  useGetTeacherTransactionsQuery,
  useGetPayoutInfoQuery,
} from "@/redux/features/payment/payment.api";
import { toast } from "sonner";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Earnings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripeStatus = searchParams.get("status");
  const { data: userData, refetch: refetchUser, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const user = userData?.data;
  const [connectStripeAccount, { isLoading: isConnecting }] =
    useConnectStripeAccountMutation();

  // Transaction period state
  const [transactionPeriod, setTransactionPeriod] = useState<"month" | "3months" | "6months" | "year" | "all">("month");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch earnings data
  const { data: earningsData, refetch, isLoading: isEarningsLoading } = useGetTeacherEarningsQuery(
    user?.id || "",
    {
      skip: !user?.id,
    }
  );

  // Fetch transactions data
  const { data: transactionsData, isLoading: isTransactionsLoading } = useGetTeacherTransactionsQuery(
    {
      teacherId: user?.id || "",
      period: transactionPeriod
    },
    {
      skip: !user?.id,
    }
  );

  // Fetch payout info
  const { data: payoutInfoData, isLoading: isPayoutInfoLoading } = useGetPayoutInfoQuery(
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

  // Define transaction interfaces
  interface Transaction {
    id: string | number;
    date: string;
    course: string;
    amount: string;
    status: string;
  }

  interface ApiTransaction {
    _id: string;
    createdAt: string;
    courseName: string;
    teacherShare: number;
    status: string;
  }

  // Define payout info interface
  interface PayoutInfo {
    payoutMethod: string;
    nextPayoutDate: Date | string;
    payoutSchedule: string;
    accountStatus: string;
  }

  // Define earning stats with icons
  const earningStats = [
    {
      label: "Total Earnings",
      value: `$${earningsData?.data?.totalEarnings?.toFixed(2) || "0.00"}`,
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      label: "This Month",
      value: `$${earningsData?.data?.monthlyEarnings?.toFixed(2) || "0.00"}`,
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Pending Payout",
      value: `$${earningsData?.data?.weeklyEarnings?.toFixed(2) || "0.00"}`,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Lifetime Students",
      value: earningsData?.data?.enrolledStudents || "0",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  // Use real transaction data if available, otherwise fallback to mock data
  const transactionHistory: Transaction[] = transactionsData?.data?.length > 0
    ? transactionsData.data.map((transaction: ApiTransaction) => ({
        id: transaction._id,
        date: format(new Date(transaction.createdAt), "yyyy-MM-dd"),
        course: transaction.courseName || "Unknown Course",
        amount: `$${transaction.teacherShare.toFixed(2)}`,
        status: transaction.status,
      }))
    : [
        {
          id: 1,
          date: format(new Date(), "yyyy-MM-dd"),
          course: "Introduction to React",
          amount: "$29.99",
          status: "completed",
        },
        {
          id: 2,
          date: format(new Date(Date.now() - 86400000), "yyyy-MM-dd"),
          course: "Advanced TypeScript Patterns",
          amount: "$49.99",
          status: "completed",
        },
        {
          id: 3,
          date: format(new Date(Date.now() - 172800000), "yyyy-MM-dd"),
          course: "Full Stack Development with Node.js",
          amount: "$59.99",
          status: "completed",
        },
      ];

  // Payout information with real data or fallback
  const payoutInfo: PayoutInfo = payoutInfoData?.data || {
    payoutMethod: "Stripe",
    nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    payoutSchedule: "Monthly",
    accountStatus: user?.stripeVerified ? "Active" : "Not Connected"
  };

  // Handle period change
  const handlePeriodChange = (period: "month" | "3months" | "6months" | "year" | "all") => {
    setTransactionPeriod(period);
  };

  // Loading states for skeleton UI
  const isLoading = isUserLoading || isEarningsLoading || isTransactionsLoading || isPayoutInfoLoading;

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

      {isLoading ? (
        <div className="space-y-4 mt-6">
          <Skeleton className="h-10 w-full max-w-[300px]" />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            {[1, 2, 3, 4].map((index) => (
              <Card key={index} className="border border-gray-100 shadow-sm">
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skeleton for Payout Information */}
          <Card className="border border-gray-100 shadow-sm mt-6">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-40" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24 sm:w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {earningStats.map((stat, index) => (
                <Card key={index} className={`border ${stat.color} transition-all duration-200 hover:shadow-md`}>
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </h3>
                      {stat.icon}
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payout Information */}
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <span>Payout Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="w-32">Payout Method</span>
                    </span>
                    <Badge variant="outline" className="text-sm font-normal">
                      {payoutInfo.payoutMethod}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="w-32">Next Payout</span>
                    </span>
                    <Badge variant="outline" className="text-sm font-normal">
                      {format(new Date(payoutInfo.nextPayoutDate), "MMMM d, yyyy")}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="w-32">Schedule</span>
                    </span>
                    <Badge variant="outline" className="text-sm font-normal">
                      {payoutInfo.payoutSchedule}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="w-32">Account Status</span>
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-sm font-normal ${
                        payoutInfo.accountStatus === "Active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {payoutInfo.accountStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6 mt-6">
            {/* Transaction History */}
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Transaction History</span>
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      {transactionPeriod === "month" && "This Month"}
                      {transactionPeriod === "3months" && "Last 3 Months"}
                      {transactionPeriod === "6months" && "Last 6 Months"}
                      {transactionPeriod === "year" && "This Year"}
                      {transactionPeriod === "all" && "All Time"}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-full sm:w-auto">
                    <DropdownMenuItem onClick={() => handlePeriodChange("month")}>
                      This Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePeriodChange("3months")}>
                      Last 3 Months
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePeriodChange("6months")}>
                      Last 6 Months
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePeriodChange("year")}>
                      This Year
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePeriodChange("all")}>
                      All Time
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    {transactionHistory.length > 0 ? (
                      <>
                        {/* Desktop view */}
                        <table className="w-full hidden sm:table">
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
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 text-sm">{transaction.date}</td>
                                <td className="py-3 px-4 text-sm font-medium">{transaction.course}</td>
                                <td className="py-3 px-4 text-right text-sm font-medium">
                                  {transaction.amount}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Badge
                                    variant="outline"
                                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                      transaction.status === "completed" || transaction.status === "success"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : transaction.status === "pending"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                    }`}
                                  >
                                    {transaction.status === "completed" || transaction.status === "success"
                                      ? "Completed"
                                      : transaction.status === "pending"
                                      ? "Pending"
                                      : "Failed"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Mobile view */}
                        <div className="sm:hidden space-y-4">
                          {transactionHistory.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="border-b border-gray-100 pb-4 space-y-2 hover:bg-gray-50 p-2 rounded transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Date</span>
                                <span className="text-sm">{transaction.date}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-gray-500">Course</span>
                                <p className="text-sm font-medium">{transaction.course}</p>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{transaction.amount}</span>
                                <Badge
                                  variant="outline"
                                  className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                    transaction.status === "completed" || transaction.status === "success"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : transaction.status === "pending"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {transaction.status === "completed" || transaction.status === "success"
                                    ? "Completed"
                                    : transaction.status === "pending"
                                    ? "Pending"
                                    : "Failed"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No transactions found for this period.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Earnings;