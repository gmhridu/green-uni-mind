import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <DashboardHeader /> */}
      <DashboardSidebar />
      <main className={`${isMobile ? 'pl-0' : 'pl-64'} min-h-screen mt-3`}>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
