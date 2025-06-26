import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  useGetDashboardSummaryQuery,
  useGetEnrollmentStatisticsQuery,
  useGetEngagementMetricsQuery,
  useGetRevenueAnalyticsQuery,
  useGetPerformanceMetricsQuery
} from '@/redux/features/analytics/analyticsApi';
import { DashboardStats } from '@/types/analytics';


export const useDashboardAnalytics = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const teacherId = user?._id as string;



  // Fetch all analytics data first
  const {
    data: dashboardSummary,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useGetDashboardSummaryQuery(teacherId, {
    skip: !teacherId,
    // Reduce polling frequency to avoid conflicts with real-time updates
    pollingInterval: 600000, // Poll every 10 minutes (increased from 5)
  });



  // Standard analytics - no real-time updates
  const isRealTimeConnected = false;
  const realTimeError = null;
  const lastRealTimeUpdate = null;

  const {
    data: enrollmentData,
    isLoading: isEnrollmentLoading,
  } = useGetEnrollmentStatisticsQuery(
    { teacherId, filters: { period: 'monthly' } },
    { skip: !teacherId }
  );

  const {
    data: engagementData,
    isLoading: isEngagementLoading,
  } = useGetEngagementMetricsQuery(
    { teacherId, filters: { period: 'monthly' } },
    { skip: !teacherId }
  );

  const {
    data: revenueData,
    isLoading: isRevenueLoading,
  } = useGetRevenueAnalyticsQuery(
    { teacherId, filters: { period: 'monthly' } },
    { skip: !teacherId }
  );

  const {
    data: performanceData,
    isLoading: isPerformanceLoading,
  } = useGetPerformanceMetricsQuery(
    { teacherId, filters: { period: 'monthly' } },
    { skip: !teacherId }
  );

  // Combine all loading states
  const isLoading = isDashboardLoading || isEnrollmentLoading || isEngagementLoading || isRevenueLoading || isPerformanceLoading;

  // Check if we have API errors that should show error state (not empty state)
  const hasApiErrors = dashboardError &&
    (dashboardError as any)?.status !== 404 &&
    (dashboardError as any)?.status !== 401;

  // Transform data into dashboard stats format
  const dashboardStats: DashboardStats = useMemo(() => {

    // Return empty state for new teachers or when data is unavailable (but not for real errors)
    if (!dashboardSummary?.data || !enrollmentData?.data || !revenueData?.data || !performanceData?.data) {
      return {
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        totalStudents: 0,
        totalEarnings: 0,
        avgRating: 0,
        monthlyEarnings: 0,
        completionRate: 0,
        newStudentsThisMonth: 0,
        totalReviews: 0,
        coursesGrowth: 0,
        studentsGrowth: 0,
        earningsGrowth: 0,
        ratingGrowth: 0,
        completionRateGrowth: 0,
        performanceScore: 'Average'
      };
    }

    const summary = dashboardSummary.data.overview;
    const enrollment = enrollmentData.data;
    const revenue = revenueData.data;
    const performance = performanceData.data;

    // Calculate performance score based on multiple metrics
    const getPerformanceScore = () => {
      const ratingScore = (summary.averageRating / 5) * 100;
      const completionScore = performance.courseCompletionRate;
      const retentionScore = performance.studentRetentionRate;
      const satisfactionScore = performance.studentSatisfactionScore;
      
      const overallScore = (ratingScore + completionScore + retentionScore + satisfactionScore) / 4;
      
      if (overallScore >= 85) return 'Excellent';
      if (overallScore >= 70) return 'Good';
      if (overallScore >= 50) return 'Average';
      return 'Poor';
    };

    return {
      totalCourses: summary.totalCourses,
      publishedCourses: Math.floor(summary.totalCourses * 0.8), // Estimate based on typical ratios
      draftCourses: Math.floor(summary.totalCourses * 0.2),
      totalStudents: summary.totalStudents,
      totalEarnings: summary.totalRevenue,
      avgRating: summary.averageRating,
      monthlyEarnings: revenue.revenueByPeriod.monthly,
      completionRate: Math.round(performance.courseCompletionRate),
      newStudentsThisMonth: enrollment.newEnrollments,
      totalReviews: performance.totalReviews,
      coursesGrowth: 12, // This would come from trend analysis
      studentsGrowth: enrollment.growthRate,
      earningsGrowth: revenue.revenueGrowth,
      ratingGrowth: 2, // This would come from rating trend analysis
      completionRateGrowth: 5, // This would come from completion rate trends
      performanceScore: getPerformanceScore()
    };
  }, [dashboardSummary, enrollmentData, revenueData, performanceData, engagementData]);

  // Recent activities from dashboard summary
  const recentActivities = dashboardSummary?.data?.recentActivities || [];

  // Top performing courses
  const topPerformingCourses = dashboardSummary?.data?.topPerformingCourses || [];

  // Insights and recommendations
  const insights = dashboardSummary?.data?.insights || [];

  // Detailed metrics for charts and advanced analytics
  const detailedMetrics = useMemo(() => ({
    enrollment: enrollmentData?.data,
    engagement: engagementData?.data,
    revenue: revenueData?.data,
    performance: performanceData?.data,
  }), [enrollmentData, engagementData, revenueData, performanceData]);



  return {
    // Main dashboard data
    dashboardStats,
    recentActivities,
    topPerformingCourses,
    insights,
    detailedMetrics,

    // Loading and error states
    isLoading,
    error: hasApiErrors ? dashboardError : null, // Only show real errors, not empty state scenarios

    // Refetch function
    refetch: refetchDashboard,

    // Real-time connection status
    realTime: {
      isConnected: isRealTimeConnected,
      lastUpdate: lastRealTimeUpdate,
      error: realTimeError,
    },

    // Individual loading states for granular control
    loadingStates: {
      dashboard: isDashboardLoading,
      enrollment: isEnrollmentLoading,
      engagement: isEngagementLoading,
      revenue: isRevenueLoading,
      performance: isPerformanceLoading,
    }
  };
};
