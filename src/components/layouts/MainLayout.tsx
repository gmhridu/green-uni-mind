import { logout } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { Layout } from "antd";
import { toast } from "sonner";
import SidebarLayout from "./SidebarLayout";
import { Content, Footer as AntFooter, Header } from "antd/es/layout/layout";
import { Button } from "../ui/button";
import { Outlet } from "react-router-dom";
import Footer from "../Footer";

const MainLayout = () => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logout Successfully!");
  };

  return (
    <>
      
    </>
  );
};

export default MainLayout;
