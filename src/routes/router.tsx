import ProtectedRoute from "@/components/layouts/ProtectedRoutes";
import UserProfileContainer from "@/components/UserProfileContainer";
import LoginPage from "@/pages/Auth/LoginPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import CreatorCourses from "@/pages/Course/CreatorCourses";
import EditUserPhoto from "@/pages/EditUserProfile/EditUserPhoto";
import EditUserProfile from "@/pages/EditUserProfile/EditUserProfile";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
// import CreateLecture from "@/pages/Lecture/CreateLecture";
import NotFound from "@/pages/NotFound";
import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { USER_ROLE } from "@/constants/global";
import CreateCourse from "@/pages/Course/CreateCourse";
import Layout from "@/components/layouts/Layout";
import Dashboard from "@/pages/Teacher/Dashboard";
import Courses from "@/pages/Teacher/Courses";
import CourseCreate from "@/pages/Teacher/CourseCreate";
import Earnings from "@/pages/Teacher/Earnings";
import Settings from "@/pages/Teacher/Settings";
import Materials from "@/pages/Teacher/Materials";
import Students from "@/pages/Teacher/Students";
import LectureCreate from "@/pages/Teacher/LectureCreate";
import CourseLectures from "@/pages/Teacher/CourseLectures";
import EditLecture from "@/components/Dashboard/EditLecture";
import StudentHome from "@/pages/Student/StudentHome";
import StudentDashboard from "@/pages/Student/StudentDashboard";
import StudentLayout from "@/pages/Student/StudentLayout";
import CoursePage from "@/pages/Student/CoursePage";
import LecturePage from "@/pages/Student/LecturePage";
import PublicRoute from "@/components/layouts/PublicRoutes";
import CourseDetails from "@/pages/CourseDetails";
import PaymentSuccess from "@/pages/payment/success";
import PaymentCancel from "@/pages/payment/cancel";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "user",
        element: <UserProfileContainer />,
        children: [
          {
            index: true,
            path: "edit-profile",
            element: <EditUserProfile />,
          },
          {
            path: "edit-photo",
            element: <EditUserPhoto />,
          },
        ],
      },
      {
        path: "create-course",
        element: <CreateCourse />,
      },
      {
        path: "/courses/:courseId",
        element: <CourseDetails />,
      },
      {
        path: "my-courses",
        element: <CreatorCourses />,
      },
      // {
      //   path: "/create-lecture/:courseId",
      //   element: <CreateLecture />,
      // },
      {
        path: "/payment/success",
        element: <PaymentSuccess />,
      },
      {
        path: "/payment/cancel",
        element: <PaymentCancel />,
      },
    ],
  },
  {
    path: "teacher",
    element: (
      <ProtectedRoute role={USER_ROLE.TEACHER}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "courses",
        element: <Courses />,
      },
      {
        path: "courses/create",
        element: <CourseCreate />,
      },
      {
        path: "courses/:courseId/lecture/create",
        element: <LectureCreate />,
      },
      {
        path: "courses/:courseId",
        element: <CourseLectures />,
      },
      {
        path: "courses/:courseId/lecture/edit/:lectureId",
        element: <EditLecture />,
      },
      {
        path: "materials",
        element: <Materials />,
      },
      {
        path: "earnings",
        element: <Earnings />,
      },
      {
        path: "students",
        element: <Students />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "student",
    element: (
      <ProtectedRoute role={USER_ROLE.STUDENT}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StudentHome />,
      },
      {
        path: "dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "course/:courseId",
        element: <CoursePage />,
      },
      {
        path: "course/:courseId/lecture/:lectureId",
        element: <LecturePage />,
      },
    ],
  },
  {
    path: "sign-up",
    element: (
      <PublicRoute>
        <SignUpPage />
      </PublicRoute>
    ),
  },
  {
    path: "login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
