import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "../AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import UserProfile from "../UserProfile";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  logout,
  selectAuthLoading,
  selectCurrentUser,
} from "@/redux/features/auth/authSlice";
import { useLogoutMutation } from "@/redux/features/auth/authApi";
import { useRef, useState } from "react";
import { baseApi } from "@/redux/api/baseApi";
import { toast } from "sonner";
import { clearCart, setCart } from "@/redux/features/cart/cartSlice";

export default function SidebarLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const [signOut] = useLogoutMutation(undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(undefined).unwrap();
      dispatch(logout());
      dispatch(setCart({ items: [], userId: null }));
      dispatch(baseApi.util.resetApiState());
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed");
    }
  };
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto">
              <UserProfile
                user={user || null}
                isAuthLoading={isAuthLoading}
                open={open}
                setOpen={setOpen}
                hoverTimeout={hoverTimeout}
                handleLogout={handleLogout}
              />
            </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
