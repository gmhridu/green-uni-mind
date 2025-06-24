import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Download,
  BarChart3,
  Grid3X3,
  List,
  Table as TableIcon,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Redux
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import {
  setFilters,
  setViewMode,
  setActiveTab,
  setSearch,
  clearSelectedCourses,
  setSelectedCourses,
  updateTableColumn
} from "@/redux/features/course/courseManagementSlice";

// Components
import CourseStatsOverview from "@/components/Courses/CourseStatsOverview";
import CourseDataTable from "@/components/Courses/CourseDataTable";
import CourseFilters from "@/components/Courses/CourseFilters";
import CourseSearch from "@/components/Courses/CourseSearch";

// Types
import { ICourse } from "@/types/course";
import {
  CourseFilters as ICourseFilters,
  EnhancedCourse,
  CourseStats,
  CourseSortField,
  CourseViewMode
} from "@/types/course-management";

const Courses: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const courseState = useAppSelector((state) => state.courseManagement);
  const { filters, viewMode, ui, selectedCourses, tableColumns } = courseState;

  // API queries
  const {
    data: courseData,
    isLoading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses
  } = useGetCreatorCourseQuery(
    { id: teacherId },
    { skip: !teacherId }
  );

  // Memoized data
  const courses = useMemo(() => {
    const apiCourses = courseData?.data || [];
    return apiCourses.map((course: ICourse): EnhancedCourse => ({
      ...course,
      totalRevenue: course.isFree === 'paid' && course.coursePrice && course.enrolledStudents?.length
        ? course.coursePrice * course.enrolledStudents.length
        : 0,
      averageRating: 4.5, // TODO: Get from actual reviews
      completionRate: 75, // TODO: Get from actual analytics
      enrollmentTrend: 'up' as const, // TODO: Calculate from data
      analytics: {
        enrollmentCount: course.enrolledStudents?.length || 0,
        completionRate: 75,
        averageRating: 4.5,
        totalRevenue: course.isFree === 'paid' && course.coursePrice && course.enrolledStudents?.length
          ? course.coursePrice * course.enrolledStudents.length
          : 0,
        monthlyEnrollments: 10,
        weeklyEnrollments: 3,
        enrollmentGrowth: 15,
        ratingTrend: 5,
        revenueTrend: 20,
        engagementScore: 85,
        dropoffRate: 15,
        averageWatchTime: 45,
        certificatesIssued: 50,
        studentSatisfaction: 90
      }
    }));
  }, [courseData]);

  const stats = useMemo((): CourseStats => {
    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c: EnhancedCourse) => c.status === 'published').length;
    const draftCourses = courses.filter((c: EnhancedCourse) => c.status === 'draft').length;
    const archivedCourses = courses.filter((c: EnhancedCourse) => c.status === 'archived').length;
    const totalEnrollments = courses.reduce((sum: number, c: EnhancedCourse) => sum + (c.enrolledStudents?.length || 0), 0);
    const totalRevenue = courses.reduce((sum: number, c: EnhancedCourse) => sum + (c.totalRevenue || 0), 0);
    const averageRating = courses.length > 0
      ? courses.reduce((sum: number, c: EnhancedCourse) => sum + (c.averageRating || 0), 0) / courses.length
      : 0;
    const averageCompletionRate = courses.length > 0
      ? courses.reduce((sum: number, c: EnhancedCourse) => sum + (c.completionRate || 0), 0) / courses.length
      : 0;

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalEnrollments,
      totalRevenue,
      averageRating,
      averageCompletionRate,
      monthlyGrowth: 15,
      weeklyGrowth: 8,
      topPerformingCourse: courses.length > 0 ? courses[0].title : '',
      recentActivity: 5
    };
  }, [courses]);

  // Handlers
  const handleFiltersChange = (newFilters: Partial<ICourseFilters>) => {
    dispatch(setFilters(newFilters));
  };

  const handleSearchChange = (search: string) => {
    dispatch(setSearch(search));
  };

  const handleSortChange = (
    sortBy: CourseSortField,
    sortOrder: 'asc' | 'desc'
  ) => {
    dispatch(setFilters({ sortBy, sortOrder }));
  };

  const handleViewModeChange = (mode: CourseViewMode) => {
    dispatch(setViewMode(mode));
  };

  const handleTabChange = (tab: 'overview' | 'courses' | 'analytics' | 'insights') => {
    dispatch(setActiveTab(tab));
  };

  const handleSelectionChange = (courseIds: string[]) => {
    dispatch(setSelectedCourses(courseIds));
  };

  const handleColumnResize = (columnKey: string, width: number) => {
    dispatch(updateTableColumn({ key: columnKey, updates: { width } }));
  };

  const handleColumnToggle = (columnKey: string, visible: boolean) => {
    dispatch(updateTableColumn({ key: columnKey, updates: { visible } }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchCourses();
      toast.success("Courses refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh courses");
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      // TODO: Implement export functionality
      toast.info("Export functionality coming soon");
    } catch (error) {
      toast.error("Failed to export courses");
    }
  };

  const handleRowClick = (course: EnhancedCourse) => {
    navigate(`/teacher/courses/${course._id}/details`);
  };

  const handleBulkAction = (action: string) => {
    // TODO: Implement bulk actions
    toast.info(`Bulk action "${action}" coming soon`);
  };

  // Loading state
  const isLoading = coursesLoading;

  // Error handling
  useEffect(() => {
    if (coursesError) {
      toast.error("Failed to load courses");
    }
  }, [coursesError]);

  // Clear selections on unmount
  useEffect(() => {
    return () => {
      dispatch(clearSelectedCourses());
    };
  }, [dispatch]);

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Courses dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">
            Manage and analyze your course portfolio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button asChild>
            <Link to="/teacher/courses/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={ui.activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Courses
            {stats.totalCourses > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.totalCourses}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <CourseStatsOverview
            stats={stats}
            isLoading={isLoading}
            timeRange="month"
          />
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {/* Filters and Search */}
          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                  <CourseSearch
                    value={filters.search || ''}
                    onChange={handleSearchChange}
                    className="w-full sm:w-80"
                  />

                  <CourseFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    categories={[]} // TODO: Get from API
                    isLoading={isLoading}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('table')}
                  >
                    <TableIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Table */}
          <CourseDataTable
            courses={courses}
            columns={tableColumns}
            isLoading={isLoading}
            selectedCourses={selectedCourses}
            onSelectionChange={handleSelectionChange}
            onSort={handleSortChange}
            onColumnResize={handleColumnResize}
            onColumnToggle={handleColumnToggle}
            onRowClick={handleRowClick}
            onBulkAction={handleBulkAction}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Advanced Analytics
            </h3>
            <p>Detailed analytics features coming soon</p>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              AI-Powered Insights
            </h3>
            <p>Smart insights and recommendations coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default Courses;
