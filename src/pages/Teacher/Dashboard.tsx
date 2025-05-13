import React from 'react';
import { BookOpen, Users, DollarSign, TrendingUp, Loader2, Ellipsis, Edit, Eye, Plus, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { ICourse } from "@/types/course";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteCourseModal from "./DeleteCourseModal";

const Dashboard = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const {
    data: coursesData,
    isLoading,
    isError,
    isFetching,
  } = useGetCreatorCourseQuery(
    { id: userData?.data?._id },
    { skip: !userData?.data?._id }
  );

  const courses = coursesData?.data || [];
  const publishedCourses = courses.filter(
    (course) => course.status === "published"
  );
  const totalStudents = publishedCourses.reduce(
    (sum, course) => sum + (course.enrolledStudents?.length || 0),
    0
  );
  const totalEarnings = publishedCourses.reduce((sum, course) => {
    if (course.isFree === "paid" && course.coursePrice && course.enrolledStudents?.length > 0) {
      return sum + (course.coursePrice * course.enrolledStudents.length);
    }
    return sum;
  }, 0);
  const avgRating =
    courses.length > 0
      ? (
          courses.reduce((sum, course) => sum + (course.rating || 0), 0) /
          courses.length
        ).toFixed(1)
      : "0.0";

  const stats = [
    {
      title: "Total Courses",
      value: courses.length.toString(),
      icon: <BookOpen className="h-6 w-6 text-edu-primary" />,
      change: `+${publishedCourses.length} published`,
    },
    {
      title: "Total Students",
      value: totalStudents.toString(),
      icon: <Users className="h-6 w-6 text-edu-secondary" />,
      change: `+${totalStudents} enrolled`,
    },
    {
      title: "Total Earnings",
      value: `$${totalEarnings}`,
      icon: <DollarSign className="h-6 w-6 text-edu-accent" />,
      change: `$${totalEarnings} earned`,
    },
    {
      title: "Avg. Course Rating",
      value: `${avgRating}/5`,
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      change: "Based on all courses",
    },
  ];

  // Show the full skeleton during initial loading
  if (isLoading && !coursesData) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-medium">Error loading dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">Teacher Dashboard</h1>
        <Button asChild className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto transition-all duration-300 shadow-sm hover:shadow-md">
          <Link to="/teacher/courses/create" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" /> Create New Course
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="stats-card overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-full bg-gray-50">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Courses Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
          <CardTitle className="text-gray-800">Recent Courses</CardTitle>
          {courses.length > 0 && !(isLoading || isFetching) && (
            <Button variant="outline" size="sm" asChild className="hover:bg-gray-100 transition-colors">
              <Link to="/teacher/courses">View All Courses</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Always show skeleton during any loading/fetching state */}
          {(isLoading || isFetching) ? (
            <CourseTableSkeleton />
          ) : courses.length === 0 ? (
            // Only show "No Courses" when we're absolutely sure there are no courses
            <div className="text-center py-12 px-4 animate-in fade-in duration-300">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven't created any courses yet. Start your teaching journey by creating your first course.
              </p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700 transition-all duration-300 shadow-sm hover:shadow-md">
                <Link to="/teacher/courses/create" className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" /> Create Your First Course
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 animate-in fade-in duration-300">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Course
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                        Students
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.slice(0, 5).map((course: ICourse) => (
                      <tr
                        key={course._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium line-clamp-1">{course.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1 hidden sm:block">
                            {course.subtitle || "No subtitle"}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                course.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {course.status === "published" ? "Published" : "Draft"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              course.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {course.status === "published" ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <span className="font-medium">{course.enrolledStudents?.length || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <span className="font-medium">
                            {course.isFree === "free"
                              ? "Free"
                              : course.coursePrice
                              ? `$${course.coursePrice}`
                              : "Not set"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex hover:bg-gray-100 transition-colors">
                              <Link to={`/teacher/courses/${course._id}`}>
                                <Edit className="h-4 w-4 mr-1" /> Manage
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex hover:bg-gray-50 transition-colors">
                              <Link to={`/teacher/courses/${course._id}/lecture/create`}>
                                <Plus className="h-4 w-4 mr-1" /> Add Lecture
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-gray-100 transition-colors">
                                  <Ellipsis className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem asChild>
                                  <Link to={`/teacher/courses/edit-course/${course._id}`} className="flex items-center">
                                    <Edit className="mr-2 size-4" />
                                    Edit Course
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <DeleteCourseModal
                                    courseId={course._id as string}
                                    courseName={course.title}
                                    trigger={
                                      <div className="flex items-center text-red-600 w-full">
                                        <Trash className="mr-2 size-4" />
                                        <span>Delete Course</span>
                                      </div>
                                    }
                                  />
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex justify-center mt-6">
            {courses.length > 0 && !(isLoading || isFetching) && (
              <Button variant="outline" asChild className="hover:bg-gray-100 transition-colors shadow-sm hover:shadow-md">
                <Link to="/teacher/courses" className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" /> View All Courses
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
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
    <main className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="stats-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Courses Table Skeleton */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-36" />
        </CardHeader>
        <CardContent>
          <CourseTableSkeleton />
        </CardContent>
      </Card>
    </main>
  );
};

export default Dashboard;
