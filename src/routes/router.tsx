import UserProfileContainer from "@/components/UserProfileContainer";
import LoginPage from "@/pages/Auth/LoginPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import CreateCourse from "@/pages/Course/CreateCourse";
import CreatorCourses from "@/pages/Course/CreatorCourses";
import EditUserPhoto from "@/pages/EditUserProfile/EditUserPhoto";
import EditUserProfile from "@/pages/EditUserProfile/EditUserProfile";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
import CreateLecture from "@/pages/Lecture/CreateLecture";
import NotFound from "@/pages/NotFound";
import SignAsTeacher from "@/pages/Teacher/SignAsTeacher";
import { createBrowserRouter } from "react-router-dom";

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
            element: <EditUserProfile />,
          },
          {
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
        path: "my-courses",
        element: <CreatorCourses />,
      },
      {
        path: "/create-lecture/:courseId",
        element: <CreateLecture />,
      },
    ],
  },
  {
    path: "sign-up",
    element: <SignUpPage />,
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
