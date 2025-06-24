import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Eye,
  Users,
  DollarSign,
  Star,
  Clock,
  BookOpen,
  Video,
  BarChart3,
  TrendingUp,
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useGetCourseByIdQuery } from "@/redux/features/course/course.api";
import { useGetLectureByCourseIdQuery } from "@/redux/features/lecture/lectureApi";
import QuickLectureActions from "@/components/Lecture/QuickLectureActions";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
// Simple format functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  // API queries
  const { data: courseData, isLoading: courseLoading } = useGetCourseByIdQuery(
    courseId || "",
    { skip: !courseId }
  );

  const { data: lecturesData, isLoading: lecturesLoading } = useGetLectureByCourseIdQuery(
    { id: courseId! },
    { skip: !courseId }
  );

  const course = courseData?.data;
  const lectures = lecturesData?.data || [];

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Courses', href: '/teacher/courses' },
    { label: course?.title || 'Course Details', current: true },
  ];

  // Loading state
  if (courseLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!course) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/teacher/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Calculate course stats
  const totalLectures = lectures.length;
  const totalDuration = lectures.reduce((sum: number, lecture: any) => sum + (lecture.duration || 0), 0);
  const enrollmentCount = course.enrolledStudents?.length || 0;
  const revenue = course.isFree === 'paid' && course.coursePrice 
    ? course.coursePrice * enrollmentCount 
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {course.title}
            </h1>
            <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
              {course.status}
            </Badge>
          </div>
          {course.subtitle && (
            <p className="text-lg text-gray-600 mb-4">{course.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDate(course.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.category || 'Uncategorized'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/courses/edit-course/${courseId}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
          <QuickLectureActions
            course={course}
            variant="button"
            size="default"
            showLectureCount={false}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lectures</p>
                <p className="text-2xl font-bold">{totalLectures}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold">{enrollmentCount}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">
                  {course.isFree === 'free' ? 'Free' : formatCurrency(revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold">4.5</p>
              </div>
              <Star className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lectures">
            Lectures ({totalLectures})
          </TabsTrigger>
          <TabsTrigger value="students">
            Students ({enrollmentCount})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.courseThumbnail && (
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={course.courseThumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {course.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Level</h4>
                      <p className="text-gray-600">{course.courseLevel}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Language</h4>
                      <p className="text-gray-600">English</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Price</h4>
                      <p className="text-gray-600">
                        {course.isFree === 'free' ? 'Free' : formatCurrency(course.coursePrice || 0)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Certificate</h4>
                      <p className="text-gray-600">Included</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/teacher/courses/${courseId}`)}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Manage Lectures
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => navigate(`/teacher/courses/edit-course/${courseId}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Course
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.open(`/courses/${courseId}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Course
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Course updated</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">New student enrolled</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Lecture added</p>
                        <p className="text-xs text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Lectures Tab */}
        <TabsContent value="lectures">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Course Lectures</CardTitle>
              <QuickLectureActions 
                course={course} 
                variant="button" 
                size="sm"
                showLectureCount={false}
              />
            </CardHeader>
            <CardContent>
              {lecturesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : lectures.length > 0 ? (
                <div className="space-y-3">
                  {lectures.map((lecture: any, index: number) => (
                    <div 
                      key={lecture._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{lecture.lectureTitle}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {lecture.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                            {lecture.isPreviewFree && (
                              <Badge variant="outline" className="text-xs">
                                Free Preview
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/teacher/courses/${courseId}/lecture/edit/${lecture._id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/courses/${courseId}/lecture/${lecture._id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No lectures yet</h3>
                  <p className="text-gray-600 mb-4">Start building your course by adding lectures</p>
                  <QuickLectureActions
                    course={course}
                    variant="button"
                    size="default"
                    showLectureCount={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentCount > 0 ? (
                <div className="space-y-4">
                  {course.enrolledStudents?.slice(0, 10).map((student: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={student.profilePicture} />
                        <AvatarFallback>
                          {student.name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{student.name || 'Student'}</h4>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">75% Complete</p>
                        <p className="text-xs text-gray-500">Last active 2 days ago</p>
                      </div>
                    </div>
                  ))}
                  {enrollmentCount > 10 && (
                    <div className="text-center py-4">
                      <Button variant="outline">
                        View All {enrollmentCount} Students
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                  <p className="text-gray-600">Students will appear here once they enroll in your course</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Enrollment Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Analytics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Student Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4" />
                  <p>Reviews and ratings coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetail;
