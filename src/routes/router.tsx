import LoginPage from "@/pages/Auth/LoginPage";
import SignUpPage from "@/pages/Auth/SignUpPage";
import EditUserProfile from "@/pages/EditUserProfile/EditUserProfile";
import Home from "@/pages/Home";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
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
        path: "user/edit-profile",
        element: <EditUserProfile />,
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
