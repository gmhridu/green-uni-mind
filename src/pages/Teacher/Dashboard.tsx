import { BookOpen, Users, DollarSign, TrendingUp, Loader2, Ellipsis, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { ICourse } from "@/types/course";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const {
    data: coursesData,
    isLoading,
    isError,
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error loading dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <Button asChild className="bg-orange-600 w-full sm:w-auto">
          <Link to="/teacher/courses/create">Create New Course</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Course
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Students
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center pt-10">
                        No courses found
                      </td>
                    </tr>
                  ) : (
                    <>
                      {courses.map((course: ICourse) => (
                        <tr
                          key={course._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium">{course.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {course.subtitle}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                course.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {course.status === "published"
                                ? "Published"
                                : "Draft"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {course.enrolledStudents?.length || 0}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {course.isFree === "free"
                              ? "Free"
                              : course.coursePrice
                              ? `$${course.coursePrice}`
                              : "Not set"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                                <Link to={`/teacher/courses/edit/${course._id}`}>
                                  Edit
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                                <Link to={`/teacher/courses/${course._id}`}>
                                  View
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <Ellipsis className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                  <DropdownMenuItem asChild>
                                    <Link to={`/teacher/courses/edit/${course._id}`}>
                                      <Edit className="mr-2 size-4" />
                                      Edit Course
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/teacher/courses/${course._id}`}>
                                      <Eye className="mr-2 size-4" />
                                      View Course
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            {courses.length > 0 && (
              <Button variant="outline" asChild>
                <Link to="/teacher/courses">View All Courses</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
