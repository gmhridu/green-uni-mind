import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { TUser } from "@/redux/features/auth/authSlice";
import { cn } from "@/lib/utils";
import { USER_ROLE } from "@/constants/global";

interface UserProfileProps {
  user: TUser | null;
  isAuthLoading: boolean;
  handleLogout: () => void;
  hoverTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserProfile = ({
  user,
  isAuthLoading,
  handleLogout,
  hoverTimeout,
  open,
  setOpen,
}: UserProfileProps) => {
  if (!user) {
    return null; // Don't render anything if user is null
  }


  const userName = `${user.name?.firstName || ''} ${user.name?.middleName || ''} ${user.name?.lastName || ''}`.trim() || 'User';

  const photoUrl: string | undefined = user.photoUrl || user.profileImg;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        asChild
        onMouseEnter={() => {
          if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
          setOpen(true);
        }}
        onMouseLeave={() => {
          hoverTimeout.current = setTimeout(() => setOpen(false), 200);
        }}
        className={cn(
          "cursor-pointer",
          user?.role !== USER_ROLE.STUDENT && "ml-5"
        )}
      >
        <div>
          <Avatar className="cursor-pointer">
            {isAuthLoading ? (
              <AvatarFallback>
                <Loader2 className="animate-spin" />
              </AvatarFallback>
            ) : (
              <AvatarImage
                src={photoUrl}
                alt={userName}
                className="object-cover"
              />
            )}
            <AvatarFallback>
              {(userName?.slice(0, 2) || "US").toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onMouseEnter={() => {
          if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        }}
        onMouseLeave={() => {
          hoverTimeout.current = setTimeout(() => setOpen(false), 200);
        }}
        className="w-64"
      >
        <DropdownMenuLabel>
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={photoUrl}
                alt={userName}
                className="object-cover"
              />
              <AvatarFallback>
                {(userName?.slice(0, 2) || "US").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {userName}
              </span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={"/profile"}>My Learning</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={"/my-courses"}>My Courses</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={"/settings"}>My Cart</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={"/settings"}>Wishlist</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={"/profile"}>Notification</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={"/settings"}>Messages</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={"/profile"}>Account Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={"/settings"}>Payment Methods</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={"/profile"}>Public Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={"/user/edit-profile"}>Edit Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to={"/profile"}>Help and Support</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
