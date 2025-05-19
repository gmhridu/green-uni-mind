import ProtectedRoute from "@/components/layouts/ProtectedRoutes";
import UserProfileContainer from "@/components/UserProfileContainer";
import LoginPage from "@/pages/Auth/LoginPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import ForgotPasswordPage from "@/pages/Auth/ForgotPasswordPage";
import OAuthCallback from "@/pages/Auth/OAuthCallback";
import OAuthSuccessPage from "@/pages/Auth/OAuthSuccessPage";
import OAuthLinkCallbackPage from "@/pages/Auth/OAuthLinkCallbackPage";
import CreatorCourses from "@/pages/Course/CreatorCourses";
import EditUserPhoto from "@/pages/EditUserProfile/EditUserPhoto";
import EditUserProfile from "@/pages/EditUserProfile/EditUserProfile";
import PasswordSecurityPage from "@/pages/EditUserProfile/PasswordSecurityPage";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
// import CreateLecture from "@/pages/Lecture/CreateLecture";
import NotFound from "@/pages/NotFound";
import { createBrowserRouter } from "react-router-dom";
import { USER_ROLE } from "@/constants/global";
import CreateCourse from "@/pages/Course/CreateCourse";
import Layout from "@/components/layouts/Layout";
import Dashboard from "@/pages/Teacher/Dashboard";
import Courses from "@/pages/Teacher/Courses";
import CourseCreate from "@/pages/Teacher/CourseCreate";
import Earnings from "@/pages/Teacher/Earnings";
import EarningsReport from "@/pages/Teacher/EarningsReport";
import TransactionAnalyticsPage from "@/pages/Teacher/TransactionAnalyticsPage";
import Settings from "@/pages/Teacher/Settings";
import Students from "@/pages/Teacher/Students";
import LectureCreate from "@/pages/Teacher/LectureCreate";
import CourseLectures from "@/pages/Teacher/CourseLectures";
import EditLecture from "@/components/Dashboard/EditLecture";
import StudentDashboard from "@/pages/Student/StudentDashboard";
import StudentLayout from "@/pages/Student/StudentLayout";
import CoursePage from "@/pages/Student/CoursePage";
import LecturePage from "@/pages/Student/LecturePage";
import PublicRoute from "@/components/layouts/PublicRoutes";
import CourseDetails from "@/pages/CourseDetails";
import CheckoutPage from "@/pages/payment/CheckoutPage";
import PaymentSuccess from "@/pages/Payment/PaymentSuccess";
import CancelPage from "@/pages/payment/CancelPage";
import EditCourse from "@/pages/Teacher/EditCourse";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import AllCourses from "@/pages/AllCourses";
// import CloudinaryPlayerDemo from "@/pages/CloudinaryPlayerDemo";

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
        path: "about",
        element: <About />,
      },
      {
        path: "contact",
        element: <Contact />,
      },
      {
        path: "courses",
        element: <AllCourses />,
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
          {
            path: "password-security",
            element: <PasswordSecurityPage />,
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
        path: "/payment/checkout/:courseId",
        element: (
          <ProtectedRoute role={USER_ROLE.STUDENT}>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/payment/success",
        element: (
          <ProtectedRoute role={USER_ROLE.STUDENT}>
            <PaymentSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: "/payment/cancel",
        element: (
          <ProtectedRoute role={USER_ROLE.STUDENT}>
            <CancelPage />
          </ProtectedRoute>
        ),
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
        path: "courses/edit-course/:courseId",
        element: <EditCourse />,
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
        path: "earnings",
        element: <Earnings />,
      },
      {
        path: "earnings/report",
        element: <EarningsReport />,
      },
      {
        path: "earnings/analytics",
        element: <TransactionAnalyticsPage />,
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
        element: <StudentDashboard />,
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
    path: "forgot-password",
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: "oauth/callback",
    element: <OAuthCallback />,
  },
  {
    path: "oauth/success",
    element: <OAuthSuccessPage />,
  },
  {
    path: "oauth/link/callback",
    element: <OAuthLinkCallbackPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
