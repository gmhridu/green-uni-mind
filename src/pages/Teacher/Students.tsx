import { useState } from "react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetEnrolledStudentsQuery } from "@/redux/features/teacher/teacherApi";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Search, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ICourse } from "@/types/course";
import { IEnrolledStudent } from "@/redux/features/teacher/teacherSlice";

const Students = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  const {
    data: enrolledStudentsData,
    isLoading: isStudentsLoading,
    isError: isStudentsError,
  } = useGetEnrolledStudentsQuery(teacherId, { skip: !teacherId });

  console.log(enrolledStudentsData);

  const { data: coursesData, isLoading: isCoursesLoading } =
    useGetCreatorCourseQuery({ id: teacherId }, { skip: !teacherId });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");

  const courses = coursesData?.data || [];
  const enrolledStudents = enrolledStudentsData?.data || [];

  // Filter students based on search term and selected course
  const filteredStudents = enrolledStudents.filter(
    (student: IEnrolledStudent) => {
      const fullName =
        `${student.name.firstName} ${student.name.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse =
        selectedCourse === "all" ||
        student.enrolledCourses.some(
          (course) => course.courseId === selectedCourse
        );

      return matchesSearch && matchesCourse;
    }
  );

  // Calculate total students and completion stats
  const totalStudents = enrolledStudents.length;
  const completedStudents = enrolledStudents.filter((student) =>
    student.enrolledCourses.some((course) => course.progress === 100)
  ).length;

  // Loading skeleton
  if (isStudentsLoading || isCoursesLoading) {
    return <StudentsPageSkeleton />;
  }

  // Error state
  if (isStudentsError) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load student data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage and track your enrolled students
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">{totalStudents}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{completedStudents}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold mb-1">
                {totalStudents > 0
                  ? Math.round((completedStudents / totalStudents) * 100)
                  : 0}
                %
              </span>
              <Progress
                value={
                  totalStudents > 0
                    ? (completedStudents / totalStudents) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by course" />
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
      </div>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 py-3">
          <CardTitle className="text-lg">Enrolled Students</CardTitle>
          <CardDescription>
            {filteredStudents.length}{" "}
            {filteredStudents.length === 1 ? "student" : "students"} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrolled Courses</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: IEnrolledStudent) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={student.profileImg}
                              alt={`${student.name.firstName} ${student.name.lastName}`}
                            />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {student.name.firstName} {student.name.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.enrolledCourses.map((course) => (
                            <Badge
                              key={course.courseId}
                              variant="outline"
                              className="whitespace-nowrap"
                            >
                              {course.title}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.enrolledCourses.map((course) => (
                            <div
                              key={course.courseId}
                              className="flex flex-col"
                            >
                              <div className="flex justify-between text-xs mb-1">
                                <span>{course.title}</span>
                                <span>{course.progress}%</span>
                              </div>
                              <Progress
                                value={course.progress}
                                className="h-1.5"
                              />
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.enrolledCourses.map((course) => (
                            <Badge
                              key={course.courseId}
                              variant={
                                course.progress === 100 ? "outline" : "default"
                              }
                              className={`whitespace-nowrap ${
                                course.progress === 100
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : ""
                              }`}
                            >
                              {course.progress === 100
                                ? "Completed"
                                : "In Progress"}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCourse !== "all"
                  ? "Try adjusting your filters"
                  : "You don't have any enrolled students yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Skeleton loader for the students page
const StudentsPageSkeleton = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[200px]" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader className="bg-muted/50 py-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;
