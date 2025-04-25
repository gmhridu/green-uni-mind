import UserProfileContainer from "@/components/UserProfileContainer";
import LoginPage from "@/pages/Auth/LoginPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import EditUserPhoto from "@/pages/EditUserProfile/EditUserPhoto";
import EditUserProfile from "@/pages/EditUserProfile/EditUserProfile";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
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
    ],
  },
  {
    path: "sign-up",
    element: <SignUpPage />,
  },
  {
    path: "become-teacher",
    element: <SignAsTeacher />,
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
