import { useMemo, useState } from 'react';
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
  Target,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
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
import DeleteCourseModal from "./DeleteCourseModal";
import { cn } from "@/lib/utils";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { useAnalyticsErrorHandling } from "@/hooks/useErrorHandling";
import RecentActivity from "@/components/Dashboard/RecentActivity";
import StripeConnectStatus from "@/components/Dashboard/StripeConnectStatus";
import FinancialSummary from "@/components/Dashboard/FinancialSummary";
import StripeOnboardingModal from "@/components/Stripe/StripeOnboardingModal";
import DashboardErrorBoundary from "@/components/ErrorBoundary/DashboardErrorBoundary";
import { DashboardWelcomeState } from "@/components/EmptyStates/TeacherEmptyStates";

const Dashboard = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Modal state
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    isFetching: isCoursesFetching,
    refetch: refetchCourses
  } = useGetCreatorCourseQuery(
    { id: teacherId },
    { skip: !teacherId }
  );

  // Stripe-related queries
  const {
    data: stripeStatus,
    isLoading: isStripeStatusLoading,
    refetch: refetchStripeStatus
  } = useCheckStripeAccountStatusQuery(undefined, { skip: !teacherId });

  const {
    data: upcomingPayout,
    isLoading: isUpcomingPayoutLoading,
    refetch: refetchUpcomingPayout
  } = useGetUpcomingPayoutQuery(teacherId, { skip: !teacherId });

  const {
    data: teacherEarnings,
    isLoading: isEarningsLoading,
    refetch: refetchEarnings
  } = useGetTeacherEarningsQuery(teacherId, { skip: !teacherId });

  // Stripe mutations
  const [createAccountLink, { isLoading: isCreatingOnboardingLink }] = useCreateAccountLinkMutation();
  const [createStripeAccount, { isLoading: isCreatingStripeAccount }] = useCreateStripeAccountMutation();
  const [createPayoutRequest, { isLoading: isCreatingPayout }] = useCreatePayoutRequestMutation();

  // Stripe action handlers
  const handleConnectStripe = () => {
    setIsOnboardingModalOpen(true);
  };

  const handleCompleteOnboarding = () => {
    setIsOnboardingModalOpen(true);
  };

  const handleStartOnboarding = async () => {
    if (!teacherId || !userData?.data?.email) return;

    try {
      // First, check if teacher already has a Stripe account
      const hasStripeAccount = stripeStatus?.data?.accountId;

      if (!hasStripeAccount) {
        // Create Stripe account first
        await createStripeAccount({
          type: 'express',
          country: 'US', // You might want to make this configurable
          email: userData.data.email,
          business_type: 'individual'
        }).unwrap();

        // Refetch status to get the new account ID
        await refetchStripeStatus();
      }

      // Create account link for onboarding with enhanced success/failure handling
      const currentUrl = window.location.origin;
      const result = await createAccountLink({
        type: 'account_onboarding',
        refreshUrl: `${currentUrl}/teacher/stripe-connect-status?success=false&reason=refresh`,
        returnUrl: `${currentUrl}/teacher/stripe-connect-status?success=true`
      }).unwrap();

      if (result.data?.url) {
        // Enhanced user feedback
        toast.success('Redirecting to Stripe onboarding...');

        // Use window.location.href for better success/failure handling
        setTimeout(() => {
          window.location.href = result.data.url;
        }, 500);

        setIsOnboardingModalOpen(false);
      } else {
        throw new Error('No onboarding URL received from Stripe');
      }
    } catch (error: any) {
      console.error('Failed to start Stripe onboarding:', error);

      // Enhanced error handling with specific messages
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

      toast.error(errorMessage);
    }
  };

  const handleRequestPayout = async () => {
    if (!teacherId || !upcomingPayout?.data?.amount) return;

    try {
      await createPayoutRequest({
        teacherId,
        amount: upcomingPayout.data.amount
      }).unwrap();
      // Refetch data after successful payout request
      refetchUpcomingPayout();
      refetchEarnings();
    } catch (error) {
      console.error('Failed to request payout:', error);
    }
  };

  // Use the analytics hook for real-time dashboard data
  const {
    dashboardStats,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
    realTime,
  } = useDashboardAnalytics();

  // Use comprehensive error handling for analytics
  const {
    isNewUser: isNewTeacher
  } = useAnalyticsErrorHandling(isAnalyticsLoading, analyticsError, dashboardStats);

  const courses = useMemo(() => coursesData?.data || [], [coursesData?.data]);

  // Combine loading states
  const isLoading = isCoursesLoading || isAnalyticsLoading || isStripeStatusLoading;
  const isConnectingStripe = isCreatingOnboardingLink || isCreatingStripeAccount;

  // Determine if user is truly new (no courses AND no students AND no earnings)
  const isTrulyNewTeacher = useMemo(() => {
    return !isLoading &&
           courses.length === 0 &&
           dashboardStats.totalStudents === 0 &&
           dashboardStats.totalEarnings === 0 &&
           !stripeStatus?.data?.isConnected;
  }, [isLoading, courses.length, dashboardStats.totalStudents, dashboardStats.totalEarnings, stripeStatus?.data?.isConnected]);
  const isError = isCoursesError || analyticsError;
  const isFetching = isCoursesFetching;

  // Combined refetch function
  const refetch = () => {
    refetchCourses();
    refetchAnalytics();
    refetchStripeStatus();
    refetchUpcomingPayout();
    refetchEarnings();
  };

  // Modern statistics cards with brand colors using real analytics data
  const statsCards = useMemo(() => [
    {
      title: "Total Courses",
      value: dashboardStats.totalCourses.toString(),
      icon: <BookOpen className="w-6 h-6" />,
      change: `${dashboardStats.publishedCourses} published, ${dashboardStats.draftCourses} drafts`,
      trend: dashboardStats.coursesGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.coursesGrowth >= 0 ? '+' : ''}${dashboardStats.coursesGrowth}%`,
      color: "bg-brand-primary",
      lightColor: "bg-brand-accent",
      textColor: "text-brand-primary"
    },
    {
      title: "Total Students",
      value: dashboardStats.totalStudents.toLocaleString(),
      icon: <Users className="w-6 h-6" />,
      change: `+${dashboardStats.newStudentsThisMonth} this month`,
      trend: dashboardStats.studentsGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.studentsGrowth >= 0 ? '+' : ''}${dashboardStats.studentsGrowth.toFixed(1)}%`,
      color: "bg-brand-secondary",
      lightColor: "bg-green-50",
      textColor: "text-brand-secondary"
    },
    {
      title: "Total Earnings",
      value: `$${dashboardStats.totalEarnings.toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      change: `$${dashboardStats.monthlyEarnings.toLocaleString()} this month`,
      trend: dashboardStats.earningsGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.earningsGrowth >= 0 ? '+' : ''}${dashboardStats.earningsGrowth.toFixed(1)}%`,
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-600"
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
      title: "Completion Rate",
      value: `${dashboardStats.completionRate}%`,
      icon: <Target className="w-6 h-6" />,
      change: "Average across all courses",
      trend: dashboardStats.completionRateGrowth >= 0 ? "up" : "down",
      percentage: `${dashboardStats.completionRateGrowth >= 0 ? '+' : ''}${dashboardStats.completionRateGrowth}%`,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600"
    },
    {
      title: "Course Performance",
      value: dashboardStats.performanceScore,
      icon: <Award className="w-6 h-6" />,
      change: "Based on student feedback",
      trend: dashboardStats.performanceScore === "Excellent" || dashboardStats.performanceScore === "Good" ? "up" : "down",
      percentage: dashboardStats.performanceScore === "Excellent" ? "+5%" : dashboardStats.performanceScore === "Good" ? "+2%" : "0%",
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    }
  ], [dashboardStats]);

  // Show the full skeleton during initial loading
  if (isLoading && !coursesData && !dashboardStats.totalCourses) {
    return <DashboardSkeleton />;
  }



  if (isError && !isNewTeacher) {
    return (
      <DashboardErrorBoundary section="dashboard">
        <div className="flex justify-center items-center min-h-[50vh] p-4">
          <div className="text-center space-y-4">
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
      <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Show welcome state only for truly new teachers */}
          {isTrulyNewTeacher && (
            <DashboardWelcomeState className="mb-8" />
          )}

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
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
                {realTime && (
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      realTime.isConnected ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="text-xs text-gray-500">
                      {realTime.isConnected ? "Live" : "Offline"}
                    </span>
                  </div>
                )}
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

        {/* Enhanced Statistics Cards with improved responsiveness */}
        <DashboardErrorBoundary section="analytics">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {isAnalyticsLoading ? (
                // Show skeleton cards while analytics data is loading
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="dashboard-stat-card">
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
                  <Card key={index} className="dashboard-stat-card group hover:scale-105 transition-all duration-300">
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
                        <h3 className="dashboard-stat-label text-xs sm:text-sm">{stat.title}</h3>
                        <p className="dashboard-stat-value text-xl sm:text-2xl">{stat.value}</p>
                        <p className="dashboard-stat-change text-xs">{stat.change}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
        </DashboardErrorBoundary>

        {/* Stripe Connect Status */}
        <StripeConnectStatus
          stripeStatus={{
            isConnected: !!stripeStatus?.data?.isConnected,
            isVerified: !!stripeStatus?.data?.isVerified,
            onboardingComplete: !!stripeStatus?.data?.onboardingComplete,
            requirements: stripeStatus?.data?.requirements || [],
            accountId: stripeStatus?.data?.accountId
          }}
          isLoading={isStripeStatusLoading}
          onConnectStripe={handleConnectStripe}
          onCompleteOnboarding={handleCompleteOnboarding}
          isConnecting={isConnectingStripe}
        />

        {/* Financial Summary */}
        {stripeStatus?.data?.isConnected && (
          <FinancialSummary
            earnings={teacherEarnings?.data}
            upcomingPayout={upcomingPayout?.data}
            isLoading={isEarningsLoading || isUpcomingPayoutLoading}
            onRequestPayout={handleRequestPayout}
            isRequestingPayout={isCreatingPayout}
            stripeConnected={!!stripeStatus?.data?.isConnected}
          />
        )}

        {/* Quick Actions & Analytics */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/teacher/courses/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Course
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/teacher/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/teacher/students">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Students
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/teacher/earnings">
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Earnings
                </Link>
              </Button>
              {stripeStatus?.data?.isConnected && (
                <Button
                  onClick={handleRequestPayout}
                  disabled={isCreatingPayout || !upcomingPayout?.data?.amount}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              )}
              {!stripeStatus?.data?.isConnected && (
                <Button
                  onClick={handleConnectStripe}
                  disabled={isConnectingStripe}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Connect Stripe
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity - Dynamic Component */}
          <RecentActivity
            className="lg:col-span-2"
            limit={5}
            showHeader={true}
          />
        </div>

        {/* Modern Course Management Section */}
        <Card className="dashboard-card">
          <CardHeader className="dashboard-card-header">
            <div>
              <CardTitle className="text-xl font-semibold text-brand-text-primary flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-primary" />
                Course Management
              </CardTitle>
              <p className="text-brand-text-secondary mt-1">Manage and monitor your courses</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search courses..." className="pl-9 w-full sm:w-64" />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              {courses.length > 0 && !(isLoading || isFetching) && (
                <Button variant="outline" asChild>
                  <Link to="/teacher/courses" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View All
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(isLoading || isFetching) ? (
              <CourseTableSkeleton />
            ) : courses.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-lms-primary/10 text-lms-primary">
                  <BookOpen className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">No Courses Yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You haven't created any courses yet. Start your teaching journey by creating your first course and sharing your knowledge with students worldwide.
                </p>
                <Button asChild className="bg-lms-primary hover:bg-lms-primary-dark text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link to="/teacher/courses/create" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Course
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.slice(0, 5).map((course: ICourse) => (
                  <div key={course._id} className="dashboard-card group hover:shadow-lg transition-all duration-300">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4">
                        {/* Course Info - Mobile First Design */}
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                            {course.title.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-brand-text-primary text-base sm:text-lg mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">
                              {course.title}
                            </h3>
                            <p className="text-brand-text-secondary text-sm mb-2 line-clamp-2">
                              {course.subtitle || "No subtitle provided"}
                            </p>

                            {/* Course Meta - Responsive Layout */}
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
                              {/* Rating placeholder - would come from reviews */}
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                                4.5
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status, Price & Actions - Mobile Optimized */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={course.status === "published" ? "default" : "secondary"}
                              className={cn(
                                "text-xs",
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
                              <span className="text-brand-text-muted ml-1">
                                {course.isFree === "free" ? "Course" : "Course"}
                              </span>
                            </div>
                          </div>

                          {/* Actions - Mobile Friendly */}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild className="action-button secondary flex-1 sm:flex-none">
                              <Link to={`/teacher/courses/${course._id}`} className="flex items-center justify-center gap-1">
                                <Edit className="w-4 h-4" />
                                <span className="text-xs">Manage</span>
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="action-button secondary">
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
            )}

            {/* View All Courses Button */}
            {courses.length > 0 && !(isLoading || isFetching) && (
              <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                <Button variant="outline" asChild className="action-button secondary">
                  <Link to="/teacher/courses" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View All Courses
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stripe Onboarding Modal */}
        <StripeOnboardingModal
          isOpen={isOnboardingModalOpen}
          onClose={() => setIsOnboardingModalOpen(false)}
          onStartOnboarding={handleStartOnboarding}
          isLoading={isConnectingStripe}
          stripeStatus={{
            isConnected: !!stripeStatus?.data?.isConnected,
            isVerified: !!stripeStatus?.data?.isVerified,
            onboardingComplete: !!stripeStatus?.data?.onboardingComplete,
            requirements: stripeStatus?.data?.requirements || []
          }}
        />
      </div>
    </main>
    </DashboardErrorBoundary>
  );
};

const CourseTableSkeleton = () => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in duration-300">
      <div className="inline-block min-w-full align-middle">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <Skeleton className="h-5 w-full max-w-[200px] mb-1" />
                  <Skeleton className="h-4 w-3/4 hidden sm:block" />
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="py-3 px-4 text-right hidden md:table-cell">
                  <Skeleton className="h-5 w-8 ml-auto" />
                </td>
                <td className="py-3 px-4 text-right hidden md:table-cell">
                  <Skeleton className="h-5 w-16 ml-auto" />
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-20 hidden sm:block" />
                    <Skeleton className="h-8 w-20 hidden sm:block" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-6">
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
};

const DashboardSkeleton = () => {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <Skeleton className="h-10 w-80 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Enhanced Stats Cards Skeleton */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Card key={index} className="dashboard-stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
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
          ))}
        </div>

        {/* Quick Actions & Analytics Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
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

        {/* Course Management Skeleton */}
        <Card className="dashboard-card">
          <CardHeader className="dashboard-card-header">
            <div>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="dashboard-card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-6 w-64 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <div className="flex gap-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Dashboard;
