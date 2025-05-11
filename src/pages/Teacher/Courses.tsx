import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, ArrowUpDown, Ellipsis, Edit, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetCreatorCourseQuery } from "@/redux/features/course/courseApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ICourse } from "@/types/course";
import DeleteCourseModal from "./DeleteCourseModal";

const Courses = () => {
  const { data: meData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const teacherId = meData?.data?._id;

  const {
    data: courseData,
    isLoading,
    isError,
  } = useGetCreatorCourseQuery({ id: teacherId }, { skip: !teacherId });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const apiCourses = courseData?.data || [];

  const filteredCourses = apiCourses
    .map((course: ICourse) => ({
      id: course._id,
      title: course.title || "Untitled",
      subtitle: course.subtitle || "",
      status: course.status || "draft",
      students: course.enrolledStudents?.length || 0,
      revenue:
        course.isFree === "paid" &&
        course.coursePrice &&
        course.enrolledStudents?.length > 0
          ? `$${course.coursePrice * course.enrolledStudents.length}`
          : "$0",
      lastUpdated: new Date(course.updatedAt).toLocaleDateString(),
      isFree: course.isFree,
      coursePrice: course.coursePrice,
    }))
    .filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const isLoadingAll = isLoading || isUserLoading;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Courses
        </h1>
        <Button asChild className="bg-orange-600 w-full sm:w-auto">
          <Link to="/teacher/courses/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Course
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Status:{" "}
              {statusFilter === "all"
                ? "All"
                : statusFilter === "published"
                ? "Published"
                : "Draft"}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-full sm:w-auto">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("published")}>
              Published
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
              Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Course</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[80px]">
                      Students
                    </TableHead>
                    <TableHead className="text-right min-w-[80px]">
                      Price
                    </TableHead>
                    <TableHead className="text-right min-w-[80px]">
                      Revenue
                    </TableHead>
                    <TableHead className="text-right min-w-[100px]">
                      Last Updated
                    </TableHead>
                    <TableHead className="text-right min-w-[120px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAll
                    ? [...Array(4)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-48 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-10 ml-auto" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-12 ml-auto" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-12 ml-auto" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-24 ml-auto" />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Skeleton className="h-8 w-16 rounded-md" />
                              <Skeleton className="h-8 w-20 rounded-md" />
                              <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="font-medium">{course.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {course.subtitle}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                course.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {course.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {course.students}
                          </TableCell>
                          <TableCell className="text-right">
                            {course.isFree === "free"
                              ? "Free"
                              : course.coursePrice
                              ? `$${course.coursePrice}`
                              : "Not set"}
                          </TableCell>
                          <TableCell className="text-right">
                            {course.revenue}
                          </TableCell>
                          <TableCell className="text-right">
                            {course.lastUpdated}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="hidden sm:inline-flex"
                              >
                                <Link to={`/teacher/courses/${course.id}`}>
                                  Manage
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="hidden sm:inline-flex"
                              >
                                <Link
                                  to={`/teacher/courses/${course.id}/lecture/create`}
                                >
                                  Add Lecture
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="z-10"
                                  >
                                    <Ellipsis />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[200px]"
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        to={`/teacher/courses/edit-course/${course.id}`}
                                      >
                                        <Edit className="mr-2 size-4" />
                                        Edit Course
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <DeleteCourseModal
                                        courseId={course.id as string}
                                        courseName={course.title}
                                        trigger={
                                          <div className="flex items-center text-red-600 w-full">
                                            <Trash className="mr-2 size-4" />
                                            <span>Delete Course</span>
                                          </div>
                                        }
                                      />
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {!isLoadingAll && filteredCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No courses found. Try adjusting your filters or create a new
              course.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Courses;
