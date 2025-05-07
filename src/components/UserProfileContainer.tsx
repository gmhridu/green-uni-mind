import { Link, Outlet, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentToken } from "@/redux/features/auth/authSlice";
import { Loader2 } from "lucide-react";

const sidebarMenu = [
  { label: "Profile", path: "/user/edit-profile" },
  { label: "Photo", path: "/user/edit-photo" },
  { label: "Account Security", path: "/profile/security" },
  { label: "Subscriptions", path: "/profile/subscriptions" },
  { label: "Payment Methods", path: "/profile/payments" },
  { label: "Privacy", path: "/profile/privacy" },
  { label: "Notification Preferences", path: "/profile/notifications" },
  { label: "API Clients", path: "/profile/api-clients" },
  { label: "Close Account", path: "/profile/close-account" },
];

const UserProfileContainer = () => {
  const location = useLocation();
  const token = useAppSelector(selectCurrentToken);
  const { data, isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !token,
  });

  const user = data?.data;

  const userName = `${user?.name?.firstName} ${user?.name?.middleName} ${user?.name?.lastName}`;

  const photoUrl = user?.profileImg;

  const isActive = (path: string) => location.pathname === path;

  if(isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin"/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-[75px]">
      <div className="flex flex-col md:flex-row w-full max-w-[84rem] border rounded-lg bg-white shadow-sm md:my-5 md:mx-5">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r bg-gray-50 p-6">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <Avatar className="w-[6.4rem] h-[6.4rem] object-cover">
              <AvatarImage src={photoUrl} />
              <AvatarFallback className="bg-black text-white font-semibold text-lg">
                {(userName?.slice(0, 2) || "US").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="font-bold text-center">{userName}</h1>
          </div>

          <ul className="space-y-2 text-sm text-gray-700">
            {sidebarMenu.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "block px-3 py-2 rounded hover:bg-gray-100 transition",
                    isActive(item.path)
                      ? "bg-gray-200 text-black font-medium"
                      : "text-gray-700"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        {/* Main Form Section */}
        <main className="flex-1">
          <Outlet />;
        </main>
      </div>
    </div>
  );
};

export default UserProfileContainer;
