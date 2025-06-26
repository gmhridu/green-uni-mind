import React, { useMemo, useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  BookOpen,
  Users,
  DollarSign,
  Ellipsis,
  Edit,
  Eye,
  Plus,
  Trash,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Star,
  Award,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  Wallet,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  PlayCircle
} from "lucide-react";
import { toast } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useCheckStripeAccountStatusQuery,
  useGetUpcomingPayoutQuery,
  useGetTeacherEarningsQuery,
  useCreateAccountLinkMutation,
  useCreateStripeAccountMutation,
  useCreatePayoutRequestMutation
} from "@/redux/features/payment/payment.api";
import { ICourse } from "@/types/course";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteCourseModal from "@/pages/Teacher/DeleteCourseModal";
import { cn } from "@/lib/utils";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { useAnalyticsErrorHandling } from "@/hooks/useErrorHandling";

import DashboardErrorBoundary from "@/components/ErrorBoundary/DashboardErrorBoundary";
import RealTimeErrorBoundary from "@/components/ErrorBoundary/RealTimeErrorBoundary";
import { DashboardWelcomeState } from "@/components/EmptyStates/TeacherEmptyStates";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";

// Lazy load heavy components for better navigation performance
const RecentActivity = lazy(() => import("@/components/Dashboard/RecentActivity"));
const StripeConnectStatus = lazy(() => import("@/components/Dashboard/StripeConnectStatus"));
const FinancialSummary = lazy(() => import("@/components/Dashboard/FinancialSummary"));
const StripeOnboardingModal = lazy(() => import("@/components/Stripe/StripeOnboardingModal"));

const EnhancedTeacherDashboard = () => {
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Modal state
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Standard dashboard state management
  const [dashboardState, setDashboardState] = useState({
    courses: [],
    lectures: {},
    stats: {
      totalCourses: 0,
      totalLectures: 0,
      totalStudents: 0,
      totalEarnings: 0,
      lastUpdated: new Date()
    },
    isLoading: false,
    error: null
  });

  // Optimized queries with better caching and stale time - MOVED BEFORE CALLBACKS
  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    isFetching: isCoursesFetching,
    refetch: refetchCourses
  } = useGetCreatorCourseQuery(
    { id: teacherId },
    {
      skip: !teacherId,
      refetchOnFocus: false,
    }
  );

  // Use the analytics hook for real-time dashboard data - MOVED BEFORE CALLBACKS
  const {
    dashboardStats,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useDashboardAnalytics();

  // Manual refresh function - MOVED AFTER ALL QUERY DECLARATIONS
  const refreshDashboard = useCallback(async () => {
    try {
      // Trigger refetch of all queries
      await Promise.all([
        refetchCourses(),
        refetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [refetchCourses, refetchAnalytics]);

  // Initialize dashboard on mount
  const initializeDashboard = useCallback((data?: any) => {
    if (data) {
      setDashboardState(prevState => ({
        ...prevState,
        courses: data.courses || [],
        stats: data.stats || prevState.stats,
        isLoading: false,
        error: null
      }));
    }
    setIsInitialLoad(false);
  }, []);

  // Stripe-related queries with optimized settings
  const {
    data: stripeStatus,
    isLoading: isStripeStatusLoading,
    refetch: refetchStripeStatus
  } = useCheckStripeAccountStatusQuery(undefined, {
    skip: !teacherId,
    refetchOnFocus: false,
  });

  const {
    data: upcomingPayout,
    isLoading: isUpcomingPayoutLoading,
    refetch: refetchUpcomingPayout
  } = useGetUpcomingPayoutQuery(teacherId, {
    skip: !teacherId,
    refetchOnFocus: false,
  });

  const {
    data: teacherEarnings,
    isLoading: isEarningsLoading,
    refetch: refetchEarnings
  } = useGetTeacherEarningsQuery(teacherId, {
    skip: !teacherId,
    refetchOnFocus: false,
  });

  // Stripe mutations
  const [createAccountLink, { isLoading: isCreatingOnboardingLink }] = useCreateAccountLinkMutation();
  const [createStripeAccount, { isLoading: isCreatingStripeAccount }] = useCreateStripeAccountMutation();
  const [createPayoutRequest, { isLoading: isCreatingPayout }] = useCreatePayoutRequestMutation();

  // Analytics hook moved above - this is a duplicate that needs to be removed

  // Use comprehensive error handling for analytics
  const {
    isNewUser: isNewTeacher
  } = useAnalyticsErrorHandling(isAnalyticsLoading, analyticsError, dashboardStats);

  // Performance monitoring
  const {
    measureApiCall,
    recordError
  } = usePerformanceMonitoring({
    enableWebVitals: true,
    enableResourceMonitoring: true,
    onThresholdExceeded: (metric, value, threshold) => {
      console.warn(`Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`);
    }
  });

  const courses = useMemo(() => coursesData?.data || [], [coursesData?.data]);

  // Initialize dashboard with fetched data
  useEffect(() => {
    if (coursesData?.data && dashboardStats) {
      const dashboardData = {
        courses: coursesData.data,
        stats: {
          totalCourses: coursesData.data.length,
          totalLectures: dashboardStats.totalCourses || 0, // Use totalCourses as fallback
          totalStudents: dashboardStats.totalStudents || 0,
          totalEarnings: dashboardStats.totalEarnings || 0,
          lastUpdated: new Date()
        }
      };
      initializeDashboard(dashboardData);
    }
  }, [coursesData?.data, dashboardStats?.totalCourses, dashboardStats?.totalStudents, dashboardStats?.totalEarnings, initializeDashboard]);

  // Handle initial load completion for better navigation performance
  useEffect(() => {
    if (!isUserLoading && !isCoursesLoading && !isAnalyticsLoading && isInitialLoad) {
      // Mark initial load as complete after a short delay to ensure smooth rendering
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        // Show immediate success toast for better UX
        toast.dashboard.dataLoaded();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isUserLoading, isCoursesLoading, isAnalyticsLoading, isInitialLoad]);

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    return courses.filter((course: ICourse) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  // Combine loading states
  const isLoading = isCoursesLoading || isAnalyticsLoading || isStripeStatusLoading;
  const isConnectingStripe = isCreatingOnboardingLink || isCreatingStripeAccount;

  // Determine if user is truly new
  const isTrulyNewTeacher = useMemo(() => {
    return !isLoading &&
           courses.length === 0 &&
           dashboardStats.totalStudents === 0 &&
           dashboardStats.totalEarnings === 0 &&
           !stripeStatus?.data?.isConnected;
  }, [isLoading, courses.length, dashboardStats.totalStudents, dashboardStats.totalEarnings, stripeStatus?.data?.isConnected]);

  const isError = isCoursesError || analyticsError;
  const isFetching = isCoursesFetching;

  // Combined refetch function with performance monitoring and immediate toast feedback
  const refetch = async () => {
    // Show immediate loading toast
    toast.dashboard.refreshStart();

    const endMeasurement = measureApiCall('dashboard-refresh');
    try {
      await Promise.all([
        refetchCourses(),
        refetchAnalytics(),
        refetchStripeStatus(),
        refetchUpcomingPayout(),
        refetchEarnings()
      ]);
      await refreshDashboard();
      endMeasurement();

      // Show success toast
      toast.dashboard.refreshSuccess();
    } catch (error) {
      recordError(error as Error);
      endMeasurement();

      // Show error toast
      toast.dashboard.refreshError();
    }
  };

  // Enhanced statistics cards with real-time data
  const statsCards = useMemo(() => [
    {
      title: "Total Courses",
      value: dashboardState.stats.totalCourses.toString(),
      icon: <BookOpen className="w-6 h-6" />,
      change: `${dashboardStats.publishedCourses} published, ${dashboardStats.draftCourses} drafts`,
      trend: dashboardStats.coursesGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.coursesGrowth >= 0 ? '+' : ''}${dashboardStats.coursesGrowth}%`,
      color: "bg-brand-primary",
      lightColor: "bg-brand-accent",
      textColor: "text-brand-primary",
      realTimeValue: dashboardState.stats.totalCourses
    },
    {
      title: "Total Students",
      value: dashboardState.stats.totalStudents.toLocaleString(),
      icon: <Users className="w-6 h-6" />,
      change: `+${dashboardStats.newStudentsThisMonth} this month`,
      trend: dashboardStats.studentsGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.studentsGrowth >= 0 ? '+' : ''}${dashboardStats.studentsGrowth.toFixed(1)}%`,
      color: "bg-brand-secondary",
      lightColor: "bg-green-50",
      textColor: "text-brand-secondary",
      realTimeValue: dashboardState.stats.totalStudents
    },
    {
      title: "Total Earnings",
      value: `$${dashboardState.stats.totalEarnings.toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      change: `$${dashboardStats.monthlyEarnings.toLocaleString()} this month`,
      trend: dashboardStats.earningsGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.earningsGrowth >= 0 ? '+' : ''}${dashboardStats.earningsGrowth.toFixed(1)}%`,
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      realTimeValue: dashboardState.stats.totalEarnings
    },
    {
      title: "Course Rating",
      value: `${dashboardStats.avgRating.toFixed(1)}/5`,
      icon: <Star className="w-6 h-6" />,
      change: `${dashboardStats.totalReviews} total reviews`,
      trend: dashboardStats.ratingGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.ratingGrowth >= 0 ? '+' : ''}${dashboardStats.ratingGrowth}%`,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Total Lectures",
      value: dashboardState.stats.totalLectures.toString(),
      icon: <PlayCircle className="w-6 h-6" />,
      change: "Across all courses",
      trend: "up",
      percentage: "+0%",
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      realTimeValue: dashboardState.stats.totalLectures
    },
    {
      title: "Performance Score",
      value: dashboardStats.performanceScore,
      icon: <Award className="w-6 h-6" />,
      change: "Based on student feedback",
      trend: dashboardStats.performanceScore === "Excellent" || dashboardStats.performanceScore === "Good" ? "up" : "down",
      percentage: dashboardStats.performanceScore === "Excellent" ? "+5%" : dashboardStats.performanceScore === "Good" ? "+2%" : "0%",
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    }
  ], [dashboardStats, dashboardState.stats]);

  // Show the full skeleton only during true initial loading
  if (isInitialLoad && (isUserLoading || (isLoading && !coursesData && !dashboardStats.totalCourses))) {
    return <EnhancedDashboardSkeleton />;
  }

  if (isError && !isNewTeacher) {
    return (
      <DashboardErrorBoundary section="dashboard">
        <div className="flex justify-center items-center min-h-[50vh] p-4">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-red-500 font-medium">Error loading dashboard data</p>
            <p className="text-gray-600 text-sm">
              {analyticsError ? 'Failed to load analytics data' : 'Failed to load course data'}
            </p>
            <Button onClick={refetch} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary section="dashboard">
      <RealTimeErrorBoundary
        enableRetry={true}
        maxRetries={3}
        onError={(error, errorInfo) => {
          recordError(error);
          console.error('Real-time dashboard error:', error, errorInfo);
        }}
      >
        <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Show welcome state only for truly new teachers */}
          {isTrulyNewTeacher && (
            <DashboardWelcomeState className="mb-8" />
          )}

          {/* Enhanced Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {userData?.data?.name?.firstName || "Teacher"}! 👋
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-600 text-lg">
                  {isTrulyNewTeacher
                    ? "Ready to start your teaching journey? Let's create your first course!"
                    : "Here's what's happening with your courses today."
                  }
                </p>
                {/* Real-time connection indicator */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    "bg-blue-500"
                  )} />
                  <span className="text-xs text-gray-500">
                    Standard Mode
                  </span>
                  <span className="text-xs text-gray-400">
                    • Updated {dashboardState.stats.lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={refetch}
                disabled={isFetching || isAnalyticsLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", (isFetching || isAnalyticsLoading) && "animate-spin")} />
                {isFetching || isAnalyticsLoading ? "Refreshing..." : "Refresh"}
              </Button>
              <Button asChild className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Link to="/teacher/courses/create" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Course
                </Link>
              </Button>
            </div>
          </div>

          {/* Enhanced Statistics Cards with Real-time Updates */}
          <DashboardErrorBoundary section="analytics">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {isAnalyticsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="dashboard-stat-card border-0 shadow-md">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                statsCards.slice(0, 6).map((stat, index) => (
                  <Card key={index} className="dashboard-stat-card group hover:scale-105 transition-all duration-300 border-0 shadow-md hover:shadow-lg">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className={cn("dashboard-stat-icon", stat.lightColor, stat.textColor)}>
                          {stat.icon}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {stat.trend === "up" ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          <span className={cn(
                            "font-medium text-xs sm:text-sm",
                            stat.trend === "up" ? "text-green-600" : "text-red-600"
                          )}>
                            {stat.percentage}
                          </span>

                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="dashboard-stat-label text-xs sm:text-sm text-gray-600">{stat.title}</h3>
                        <p className="dashboard-stat-value text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="dashboard-stat-change text-xs text-gray-500">{stat.change}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DashboardErrorBoundary>

          {/* Stripe Connect Status with Suspense */}
          <Suspense fallback={
            <Card className="border-0 shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          }>
            <StripeConnectStatus
              stripeStatus={{
                isConnected: !!stripeStatus?.data?.isConnected,
                isVerified: !!stripeStatus?.data?.isVerified,
                onboardingComplete: !!stripeStatus?.data?.onboardingComplete,
                requirements: stripeStatus?.data?.requirements || [],
                accountId: stripeStatus?.data?.accountId
              }}
              isLoading={isStripeStatusLoading}
              onConnectStripe={() => setIsOnboardingModalOpen(true)}
              onCompleteOnboarding={() => setIsOnboardingModalOpen(true)}
              isConnecting={isConnectingStripe}
            />
          </Suspense>

          {/* Financial Summary with Suspense */}
          {stripeStatus?.data?.isConnected && (
            <Suspense fallback={
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            }>
              <FinancialSummary
                earnings={teacherEarnings?.data}
                upcomingPayout={upcomingPayout?.data}
                isLoading={isEarningsLoading || isUpcomingPayoutLoading}
                onRequestPayout={async () => {
                  if (!teacherId || !upcomingPayout?.data?.amount) return;
                  try {
                    await createPayoutRequest({
                      teacherId,
                      amount: upcomingPayout.data.amount
                    }).unwrap();
                    refetchUpcomingPayout();
                    refetchEarnings();
                  } catch (error) {
                    console.error('Failed to request payout:', error);
                  }
                }}
                isRequestingPayout={isCreatingPayout}
                stripeConnected={!!stripeStatus?.data?.isConnected}
              />
            </Suspense>
          )}

          {/* Quick Actions & Analytics */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <Card className="lg:col-span-1 border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start hover:bg-gray-50">
                  <Link to="/teacher/courses/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Course
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start hover:bg-gray-50">
                  <Link to="/teacher/analytics">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start hover:bg-gray-50">
                  <Link to="/teacher/students">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Students
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start hover:bg-gray-50">
                  <Link to="/teacher/earnings">
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Earnings
                  </Link>
                </Button>
                {stripeStatus?.data?.isConnected && (
                  <Button
                    onClick={async () => {
                      if (!teacherId || !upcomingPayout?.data?.amount) return;
                      try {
                        await createPayoutRequest({
                          teacherId,
                          amount: upcomingPayout.data.amount
                        }).unwrap();
                        refetchUpcomingPayout();
                        refetchEarnings();
                      } catch (error) {
                        console.error('Failed to request payout:', error);
                      }
                    }}
                    disabled={isCreatingPayout || !upcomingPayout?.data?.amount}
                    variant="outline"
                    className="w-full justify-start hover:bg-gray-50"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Request Payout
                  </Button>
                )}
                {!stripeStatus?.data?.isConnected && (
                  <Button
                    onClick={() => setIsOnboardingModalOpen(true)}
                    disabled={isConnectingStripe}
                    variant="outline"
                    className="w-full justify-start hover:bg-gray-50"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connect Stripe
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity - Dynamic Component with Suspense */}
            <Suspense fallback={
              <Card className="lg:col-span-2 border-0 shadow-md">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            }>
              <RecentActivity
                className="lg:col-span-2"
                limit={5}
                showHeader={true}
              />
            </Suspense>
          </div>

          {/* Enhanced Course Management Section */}
          <Card className="dashboard-card border-0 shadow-lg">
            <CardHeader className="dashboard-card-header border-b bg-gray-50/50">
              <div>
                <CardTitle className="text-xl font-semibold text-brand-text-primary flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-primary" />
                  Course Management
                </CardTitle>
                <p className="text-brand-text-secondary mt-1">Manage and monitor your courses with real-time updates</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2 hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                {filteredCourses.length > 0 && !(isLoading || isFetching) && (
                  <Button variant="outline" asChild className="hover:bg-gray-50">
                    <Link to="/teacher/courses" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View All ({courses.length})
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(isLoading || isFetching) ? (
                <EnhancedCourseTableSkeleton />
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-lms-primary/10 text-lms-primary">
                    <BookOpen className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    {searchQuery ? 'No courses found' : 'No Courses Yet'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchQuery
                      ? `No courses match "${searchQuery}". Try adjusting your search terms.`
                      : "You haven't created any courses yet. Start your teaching journey by creating your first course and sharing your knowledge with students worldwide."
                    }
                  </p>
                  {!searchQuery && (
                    <Button asChild className="bg-lms-primary hover:bg-lms-primary-dark text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link to="/teacher/courses/create" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create Your First Course
                      </Link>
                    </Button>
                  )}
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    {filteredCourses.slice(0, 5).map((course: ICourse) => (
                      <div key={course._id} className="dashboard-card group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300">
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col gap-4">
                            {/* Enhanced Course Info */}
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0 shadow-md">
                                {course.title.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-brand-text-primary text-base sm:text-lg mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">
                                  {course.title}
                                </h3>
                                <p className="text-brand-text-secondary text-sm mb-2 line-clamp-2">
                                  {course.subtitle || "No subtitle provided"}
                                </p>

                                {/* Enhanced Course Meta */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-brand-text-muted">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">{course.enrolledStudents?.length || 0} students</span>
                                    <span className="xs:hidden">{course.enrolledStudents?.length || 0}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{new Date(course.updatedAt || '').toLocaleDateString()}</span>
                                    <span className="sm:hidden">{new Date(course.updatedAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                                    4.5
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {course.lectures?.length || 0} lectures
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Status, Price & Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant={course.status === "published" ? "default" : "secondary"}
                                  className={cn(
                                    "text-xs font-medium",
                                    course.status === "published"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  )}
                                >
                                  {course.status === "published" ? "Published" : "Draft"}
                                </Badge>
                                <div className="text-sm">
                                  <span className="font-semibold text-brand-text-primary">
                                    {course.isFree === "free" ? "Free" : `$${course.coursePrice || 0}`}
                                  </span>
                                  <span className="text-brand-text-muted ml-1">Course</span>
                                </div>
                                {course.status === "published" && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Live
                                  </Badge>
                                )}
                              </div>

                              {/* Enhanced Actions */}
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild className="action-button secondary flex-1 sm:flex-none hover:bg-gray-50">
                                  <Link to={`/teacher/courses/${course._id}`} className="flex items-center justify-center gap-1">
                                    <Edit className="w-4 h-4" />
                                    <span className="text-xs">Manage</span>
                                  </Link>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="action-button secondary hover:bg-gray-50">
                                      <Ellipsis className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/teacher/courses/edit-course/${course._id}`} className="flex items-center">
                                        <Edit className="mr-2 w-4 h-4" />
                                        Edit Course
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to={`/teacher/courses/${course._id}/lecture/create`} className="flex items-center">
                                        <Plus className="mr-2 w-4 h-4" />
                                        Add Lecture
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to={`/courses/${course._id}`} target="_blank" className="flex items-center">
                                        <Eye className="mr-2 w-4 h-4" />
                                        Preview Course
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <DeleteCourseModal
                                        courseId={course._id as string}
                                        courseName={course.title}
                                        trigger={
                                          <div className="flex items-center text-red-600 w-full">
                                            <Trash className="mr-2 w-4 h-4" />
                                            <span>Delete Course</span>
                                          </div>
                                        }
                                      />
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View All Courses Button */}
                  {filteredCourses.length > 5 && (
                    <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                      <Button variant="outline" asChild className="action-button secondary hover:bg-gray-50">
                        <Link to="/teacher/courses" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View All Courses ({courses.length})
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stripe Onboarding Modal with Suspense */}
          {isOnboardingModalOpen && (
            <Suspense fallback={null}>
              <StripeOnboardingModal
                isOpen={isOnboardingModalOpen}
                onClose={() => setIsOnboardingModalOpen(false)}
                onStartOnboarding={async () => {
                  if (!teacherId || !userData?.data?.email) return;

                  try {
                    const hasStripeAccount = stripeStatus?.data?.accountId;

                    if (!hasStripeAccount) {
                      await createStripeAccount({
                        type: 'express',
                        country: 'US',
                        email: userData.data.email,
                        business_type: 'individual'
                      }).unwrap();

                      await refetchStripeStatus();
                    }

                    const currentUrl = window.location.origin;
                    const result = await createAccountLink({
                      type: 'account_onboarding',
                      refreshUrl: `${currentUrl}/teacher/stripe-connect-status?success=false&reason=refresh`,
                      returnUrl: `${currentUrl}/teacher/stripe-connect-status?success=true`
                    }).unwrap();

                    if (result.data?.url) {
                      toast.success('Redirecting to Stripe onboarding...', {
                        duration: 2000
                      });
                      setTimeout(() => {
                        window.location.href = result.data.url;
                      }, 500);
                      setIsOnboardingModalOpen(false);
                    } else {
                      throw new Error('No onboarding URL received from Stripe');
                    }
                  } catch (error: any) {
                    console.error('Failed to start Stripe onboarding:', error);
                    let errorMessage = 'Failed to start onboarding process';
                    if (error?.status === 400) {
                      errorMessage = error?.data?.message || 'Invalid request. Please check your account details.';
                    } else if (error?.status === 401) {
                      errorMessage = 'Authentication required. Please log in again.';
                    } else if (error?.status === 409) {
                      errorMessage = 'You already have a Stripe account connected.';
                    } else if (error?.status >= 500) {
                      errorMessage = 'Server error. Please try again in a few moments.';
                    } else if (error?.data?.message) {
                      errorMessage = error.data.message;
                    }
                    toast.error(errorMessage, {
                      duration: 5000
                    });
                  }
                }}
                isLoading={isConnectingStripe}
                stripeStatus={{
                  isConnected: !!stripeStatus?.data?.isConnected,
                  isVerified: !!stripeStatus?.data?.isVerified,
                  onboardingComplete: !!stripeStatus?.data?.onboardingComplete,
                  requirements: stripeStatus?.data?.requirements || []
                }}
              />
            </Suspense>
          )}
        </div>
        </main>
      </RealTimeErrorBoundary>
    </DashboardErrorBoundary>
  );
};

// Enhanced skeleton components
const EnhancedCourseTableSkeleton = () => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="dashboard-card border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-full max-w-[200px] mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-18" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EnhancedDashboardSkeleton = () => {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-10 w-80 mb-2" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-64" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Enhanced Stats Cards Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Card key={index} className="dashboard-stat-card border-0 shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stripe Connect Skeleton */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Analytics Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-0 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Course Management Skeleton */}
        <Card className="dashboard-card border-0 shadow-lg">
          <CardHeader className="dashboard-card-header border-b bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EnhancedCourseTableSkeleton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default EnhancedTeacherDashboard;
