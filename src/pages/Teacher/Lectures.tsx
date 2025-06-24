import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Clock,
  Download,
  Grid,
  List,
  MoreHorizontal,
  Video,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useGetCreatorCourseQuery } from '@/redux/features/course/courseApi';
import { ICourse, ILecture } from '@/types/course';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/formatDuration';
import { toast } from 'sonner';
import { useProgressTracking } from '@/contexts/ProgressTrackingContext';
import ProgressIndicator from '@/components/Progress/ProgressIndicator';
import LectureErrorBoundary from '@/components/ErrorBoundary/LectureErrorBoundary';

interface LectureWithCourse extends ILecture {
  course?: ICourse;
}

interface LectureStats {
  totalLectures: number;
  totalDuration: number;
  totalViews: number;
  publishedLectures: number;
  draftLectures: number;
  averageRating: number;
  totalWatchTime?: number;
  completedLectures?: number;
  averageProgress?: number;
}

interface FilterOptions {
  course: string;
  status: string;
  type: string;
  progress: string;
  duration: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

const Lectures: React.FC = () => {
  const navigate = useNavigate();
  const progressTracking = useProgressTracking();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedLectures, setSelectedLectures] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    course: 'all',
    status: 'all',
    type: 'all',
    progress: 'all',
    duration: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

  // Data fetching
  const { data: userData } = useGetMeQuery(undefined);
  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    refetch: refetchCourses,
  } = useGetCreatorCourseQuery(
    { id: userData?.data?._id },
    { skip: !userData?.data?._id }
  );

  const courses = useMemo(() => coursesData?.data || [], [coursesData?.data]);

  // State to store all lectures from all courses
  const [allLectures, setAllLectures] = useState<LectureWithCourse[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [lecturesError, setLecturesError] = useState(false);

  // Fetch lectures for all courses when courses data changes
  useEffect(() => {
    const fetchAllLectures = async () => {
      if (!courses.length) {
        setAllLectures([]);
        return;
      }

      setLecturesLoading(true);
      setLecturesError(false);

      try {
        // Import config to get the correct API base URL
        const { config } = await import('@/config');

        const lecturePromises = courses.map(async (course: ICourse) => {
          try {
            const response = await fetch(`${config.apiBaseUrl}/lectures/${course._id}/get-lectures`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch lectures for course ${course._id}`);
            }

            const data = await response.json();
            return {
              course,
              lectures: data.data || []
            };
          } catch (error) {
            console.error(`Error fetching lectures for course ${course._id}:`, error);
            return {
              course,
              lectures: []
            };
          }
        });

        const results = await Promise.all(lecturePromises);

        const combinedLectures: LectureWithCourse[] = [];
        results.forEach(({ course, lectures }) => {
          const courseLectures = lectures.map((lecture: ILecture) => ({
            ...lecture,
            course,
          }));
          combinedLectures.push(...courseLectures);
        });

        setAllLectures(combinedLectures);
      } catch (error) {
        console.error('Error fetching lectures:', error);
        setLecturesError(true);
      } finally {
        setLecturesLoading(false);
      }
    };

    fetchAllLectures();
  }, [courses]);

  // Loading state
  const isLoading = isCoursesLoading || lecturesLoading;
  const isError = isCoursesError || lecturesError;

  // Calculate statistics with progress data
  const lectureStats = useMemo((): LectureStats => {
    const totalLectures = allLectures.length;
    const totalDuration = allLectures.reduce((sum, lecture) => sum + (lecture.duration || 0), 0);
    const totalViews = allLectures.reduce((sum, lecture) => sum + (lecture.views || 0), 0);
    const publishedLectures = allLectures.filter(lecture => lecture.course?.status === 'published').length;
    const draftLectures = totalLectures - publishedLectures;

    // Calculate progress-based statistics
    let totalWatchTime = 0;
    let completedLectures = 0;

    allLectures.forEach(lecture => {
      const progress = progressTracking.getLectureProgress(lecture._id);
      if (progress) {
        totalWatchTime += progress.watchTime;
        if (progress.isCompleted) {
          completedLectures++;
        }
      }
    });

    return {
      totalLectures,
      totalDuration,
      totalViews,
      publishedLectures,
      draftLectures,
      averageRating: 4.5, // This would come from reviews data
      totalWatchTime,
      completedLectures,
      averageProgress: totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0,
    };
  }, [allLectures, progressTracking]);

  // Advanced filter and search lectures
  const filteredLectures = useMemo(() => {
    let filtered = [...allLectures];

    // Advanced search filter with multiple criteria
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(lecture => {
        const titleMatch = lecture.lectureTitle.toLowerCase().includes(query);
        const courseMatch = lecture.course?.title.toLowerCase().includes(query);
        const categoryMatch = lecture.course?.category?.toLowerCase().includes(query);
        const instructionMatch = lecture.instruction?.toLowerCase().includes(query);
        const orderMatch = lecture.order.toString().includes(query);

        return titleMatch || courseMatch || categoryMatch || instructionMatch || orderMatch;
      });
    }

    // Course filter
    if (filters.course !== 'all') {
      filtered = filtered.filter(lecture => lecture.course?._id === filters.course);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(lecture => lecture.course?.status === filters.status);
    }

    // Type filter
    if (filters.type !== 'all') {
      if (filters.type === 'video') {
        filtered = filtered.filter(lecture => lecture.videoUrl || lecture.hlsUrl);
      } else if (filters.type === 'pdf') {
        filtered = filtered.filter(lecture => lecture.pdfUrl);
      } else if (filters.type === 'preview') {
        filtered = filtered.filter(lecture => lecture.isPreviewFree);
      }
    }

    // Progress filter
    if (filters.progress !== 'all') {
      filtered = filtered.filter(lecture => {
        const progress = progressTracking.getLectureProgress(lecture._id);

        switch (filters.progress) {
          case 'completed':
            return progress?.isCompleted === true;
          case 'in-progress':
            return progress && progress.completionPercentage > 0 && !progress.isCompleted;
          case 'not-started':
            return !progress || progress.completionPercentage === 0;
          case 'high-progress':
            return progress && progress.completionPercentage >= 75;
          default:
            return true;
        }
      });
    }

    // Duration filter
    if (filters.duration !== 'all') {
      filtered = filtered.filter(lecture => {
        const duration = lecture.duration || 0;

        switch (filters.duration) {
          case 'short':
            return duration <= 300; // 5 minutes
          case 'medium':
            return duration > 300 && duration <= 1800; // 5-30 minutes
          case 'long':
            return duration > 1800; // 30+ minutes
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'title':
          aValue = a.lectureTitle;
          bValue = b.lectureTitle;
          break;
        case 'course':
          aValue = a.course?.title || '';
          bValue = b.course?.title || '';
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'views':
          aValue = a.views || 0;
          bValue = b.views || 0;
          break;
        case 'order':
          aValue = a.order;
          bValue = b.order;
          break;
        case 'progress':
          const aProgress = progressTracking.getLectureProgress(a._id);
          const bProgress = progressTracking.getLectureProgress(b._id);
          aValue = aProgress?.completionPercentage || 0;
          bValue = bProgress?.completionPercentage || 0;
          break;
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allLectures, debouncedSearchQuery, filters, progressTracking]);

  // Update pagination when filtered lectures change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalItems: filteredLectures.length,
      currentPage: 1, // Reset to first page when filters change
    }));
  }, [filteredLectures.length]);

  // Get paginated lectures
  const paginatedLectures = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredLectures.slice(startIndex, endIndex);
  }, [filteredLectures, pagination.currentPage, pagination.itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredLectures.length / pagination.itemsPerPage);

  // Debounced search with advanced functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefresh = useCallback(async () => {
    try {
      // Refetch courses first
      await refetchCourses();

      // Force re-fetch of lectures by clearing state and triggering useEffect
      setAllLectures([]);
      setLecturesLoading(true);
      setLecturesError(false);

      toast.success('Lectures refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh lectures');
    }
  }, [refetchCourses]);

  const handleSelectLecture = useCallback((lectureId: string) => {
    setSelectedLectures(prev =>
      prev.includes(lectureId)
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedLectures.length === filteredLectures.length) {
      setSelectedLectures([]);
    } else {
      setSelectedLectures(filteredLectures.map(lecture => lecture._id));
    }
  }, [selectedLectures.length, filteredLectures]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          // Focus search input
          const searchInput = document.querySelector('input[role="searchbox"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleRefresh();
          }
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigate('/teacher/courses');
          }
          break;
        case 'Escape':
          // Clear search and filters
          setSearchQuery('');
          setFilters({
            course: 'all',
            status: 'all',
            type: 'all',
            progress: 'all',
            duration: 'all',
            sortBy: 'createdAt',
            sortOrder: 'desc',
          });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh, navigate]);

  if (isLoading) {
    return <LecturesSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-500 font-medium">Error loading lectures</p>
          <p className="text-gray-600 text-sm">
            Failed to load lecture data. Please try again.
          </p>
          <Button onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8"
      role="main"
      aria-label="Lectures Management Dashboard"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Lectures Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and organize all your course lectures in one place.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
              title="Refresh lectures (Ctrl+R)"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/teacher/courses')}
              className="bg-brand-primary hover:bg-brand-primary-dark text-white"
              title="Add new lecture (Ctrl+N)"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Lecture
            </Button>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="text-xs text-gray-500 mt-2 hidden sm:block">
            <span className="font-medium">Shortcuts:</span> / to search, Ctrl+R to refresh, Ctrl+N for new, Esc to clear
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-brand-accent rounded-lg">
                  <Video className="w-6 h-6 text-brand-primary" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Lectures</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{lectureStats.totalLectures}</p>
                <p className="text-xs text-gray-600">Across all courses</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Duration</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatDuration(lectureStats.totalDuration)}
                </p>
                <p className="text-xs text-gray-600">Content hours</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Views</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {lectureStats.totalViews.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">Student engagements</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Published</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{lectureStats.publishedLectures}</p>
                <p className="text-xs text-gray-600">Live lectures</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Edit className="w-6 h-6 text-yellow-600" />
                </div>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Draft</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{lectureStats.draftLectures}</p>
                <p className="text-xs text-gray-600">In progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Avg Rating</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {lectureStats.averageRating.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600">Student feedback</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Progress</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {Math.round(lectureStats.averageProgress || 0)}%
                </p>
                <p className="text-xs text-gray-600">
                  {lectureStats.completedLectures || 0} completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-primary" />
                All Lectures ({filteredLectures.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                <Input
                  placeholder="Search lectures by title or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search lectures by title, course, category, or order number"
                  role="searchbox"
                  aria-describedby="search-help"
                />
                <div id="search-help" className="sr-only">
                  Search through lectures by title, course name, category, instruction content, or order number
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filters.course}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, course: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course: ICourse) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="preview">Preview</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.progress}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, progress: value }))}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Progress" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="high-progress">75%+ Complete</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.duration}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Durations</SelectItem>
                    <SelectItem value="short">Short (≤5m)</SelectItem>
                    <SelectItem value="medium">Medium (5-30m)</SelectItem>
                    <SelectItem value="long">Long (30m+)</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-');
                    setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }));
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                    <SelectItem value="duration-desc">Longest First</SelectItem>
                    <SelectItem value="duration-asc">Shortest First</SelectItem>
                    <SelectItem value="views-desc">Most Viewed</SelectItem>
                    <SelectItem value="views-asc">Least Viewed</SelectItem>
                    <SelectItem value="order-asc">Order (Low-High)</SelectItem>
                    <SelectItem value="order-desc">Order (High-Low)</SelectItem>
                    <SelectItem value="progress-desc">Most Progress</SelectItem>
                    <SelectItem value="progress-asc">Least Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedLectures.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mb-6">
                <span className="text-sm font-medium text-blue-900">
                  {selectedLectures.length} lecture(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Bulk Edit
                  </Button>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Lecture Content */}
            {filteredLectures.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lectures found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || filters.course !== 'all' || filters.status !== 'all' || filters.type !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start by creating your first course and adding lectures'}
                </p>
                <Button
                  onClick={() => navigate('/teacher/courses')}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            ) : viewMode === 'table' ? (
              <>
                <LectureTable
                  lectures={paginatedLectures}
                  selectedLectures={selectedLectures}
                  onSelectLecture={handleSelectLecture}
                  onSelectAll={handleSelectAll}
                />
                <PaginationControls
                  currentPage={pagination.currentPage}
                  totalPages={totalPages}
                  itemsPerPage={pagination.itemsPerPage}
                  totalItems={filteredLectures.length}
                  onPageChange={(page: number) => setPagination(prev => ({ ...prev, currentPage: page }))}
                  onItemsPerPageChange={(items: number) => setPagination(prev => ({ ...prev, itemsPerPage: items, currentPage: 1 }))}
                />
              </>
            ) : (
              <>
                <LectureGrid lectures={paginatedLectures} />
                <PaginationControls
                  currentPage={pagination.currentPage}
                  totalPages={totalPages}
                  itemsPerPage={pagination.itemsPerPage}
                  totalItems={filteredLectures.length}
                  onPageChange={(page: number) => setPagination(prev => ({ ...prev, currentPage: page }))}
                  onItemsPerPageChange={(items: number) => setPagination(prev => ({ ...prev, itemsPerPage: items, currentPage: 1 }))}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = React.memo(({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-gray-600">
          Showing {startItem}-{endItem} of {totalItems} lectures
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-gray-400">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
});

// Lecture Table Component
interface LectureTableProps {
  lectures: LectureWithCourse[];
  selectedLectures: string[];
  onSelectLecture: (lectureId: string) => void;
  onSelectAll: () => void;
}

const LectureTable: React.FC<LectureTableProps> = React.memo(({
  lectures,
  selectedLectures,
  onSelectLecture,
  onSelectAll,
}) => {
  const progressTracking = useProgressTracking();

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table role="table" aria-label="Lectures data table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={selectedLectures.length === lectures.length && lectures.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300"
                aria-label={`Select all ${lectures.length} lectures`}
                aria-describedby="select-all-help"
              />
              <div id="select-all-help" className="sr-only">
                Toggle selection for all lectures in the current view
              </div>
            </TableHead>
            <TableHead>Lecture</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lectures.map((lecture) => (
            <TableRow key={lecture._id} className="hover:bg-gray-50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedLectures.includes(lecture._id)}
                  onChange={() => onSelectLecture(lecture._id)}
                  className="rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {lecture.lectureTitle}
                    </p>
                    <p className="text-sm text-gray-500">
                      Order: {lecture.order}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900 line-clamp-1">
                    {lecture.course?.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {lecture.course?.category}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {lecture.duration ? formatDuration(lecture.duration) : 'N/A'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {(lecture.views || 0).toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                {(() => {
                  const progress = progressTracking.getLectureProgress(lecture._id);
                  return progress ? (
                    <ProgressIndicator
                      progress={progress.completionPercentage}
                      isCompleted={progress.isCompleted}
                      showPercentage={true}
                      size="sm"
                      variant="minimal"
                      syncStatus={progressTracking.state.syncStatus}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No data</span>
                  );
                })()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={lecture.course?.status === 'published' ? 'default' : 'secondary'}
                  className={cn(
                    lecture.course?.status === 'published'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                  )}
                >
                  {lecture.course?.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {lecture.videoUrl || lecture.hlsUrl ? (
                    <Badge variant="outline" className="text-xs">
                      Video
                    </Badge>
                  ) : null}
                  {lecture.pdfUrl ? (
                    <Badge variant="outline" className="text-xs">
                      PDF
                    </Badge>
                  ) : null}
                  {lecture.isPreviewFree ? (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      Preview
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/teacher/courses/${lecture.courseId}/lecture/edit/${lecture._id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Lecture
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/teacher/courses/${lecture.courseId}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Course
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

// Lecture Grid Component
interface LectureGridProps {
  lectures: LectureWithCourse[];
}

const LectureGrid: React.FC<LectureGridProps> = React.memo(({ lectures }) => {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {lectures.map((lecture) => (
        <Card key={lecture._id} className="hover:shadow-lg transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-brand-accent rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-brand-primary" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/teacher/courses/${lecture.courseId}/lecture/edit/${lecture._id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/teacher/courses/${lecture.courseId}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Course
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {lecture.lectureTitle}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-1">
              {lecture.course?.title}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lecture.duration ? formatDuration(lecture.duration) : 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {(lecture.views || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {lecture.videoUrl || lecture.hlsUrl ? (
                  <Badge variant="outline" className="text-xs">
                    Video
                  </Badge>
                ) : null}
                {lecture.pdfUrl ? (
                  <Badge variant="outline" className="text-xs">
                    PDF
                  </Badge>
                ) : null}
                {lecture.isPreviewFree ? (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    Preview
                  </Badge>
                ) : null}
              </div>

              <Badge
                variant={lecture.course?.status === 'published' ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  lecture.course?.status === 'published'
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                )}
              >
                {lecture.course?.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// Loading skeleton component
const LecturesSkeleton: React.FC = () => {
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

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

// Wrapped component with error boundary
const LecturesWithErrorBoundary: React.FC = () => {
  return (
    <LectureErrorBoundary>
      <Lectures />
    </LectureErrorBoundary>
  );
};

export default LecturesWithErrorBoundary;
