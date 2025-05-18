import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentToken, TUser } from "@/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";
import { USER_ROLE } from "@/constants/global";
import {
  studentMenu,
  TDashboardNavMenu,
  TDashboardNavMenuItem,
  teacherMenu,
} from "@/utils/SidebarItemsGenerator";
import { Link, useLocation } from "react-router-dom";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const token = useAppSelector(selectCurrentToken);
  let user: TUser | null = null;

  if (token) {
    user = verifyToken(token) as TUser;
  }

  let sidebarItems: TDashboardNavMenu = { navMain: [] };

  // Check all possible locations for the role
  const userRole = user?.role || user?.user?.role || localStorage.getItem("userRole");

  switch (userRole) {
    case USER_ROLE.TEACHER:
      sidebarItems = teacherMenu;
      break;
    case USER_ROLE.STUDENT:
      sidebarItems = studentMenu;
      break;
  }

  // Log the role being used for debugging
  console.log("AppSidebar using role:", userRole);

  const renderItems = (
    items: TDashboardNavMenuItem[],
    parentKey: string = ""
  ): React.ReactNode => {
    return items.map((item, index) => {
      const key = `${parentKey}-${item.title}-${index}`;

      // If nested items exist, render an accordion
      if (item.items && item.items.length > 0) {
        return (
          <Accordion type="single" collapsible key={key} className="w-full">
            <AccordionItem value={key}>
              <AccordionTrigger className="px-4 text-left">
                {item.title}
              </AccordionTrigger>
              <AccordionContent>
                <SidebarMenu className="pl-2 border-l">
                  {renderItems(item.items, key)}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      // Leaf node with a direct link
      return (
        <SidebarMenuItem key={key}>
          <SidebarMenuButton
            asChild
            isActive={location.pathname === item.url}
          >
            <Link to={item.url!}>{item.title}</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader />
      <SidebarContent>
        {sidebarItems.navMain.map((group, idx) => (
          <React.Fragment key={group.title + idx}>
            <div className="px-4 py-2 font-semibold text-muted-foreground uppercase text-xs">
              {group.title}
            </div>
            <SidebarMenu className="mb-2">
              {renderItems(group.items || [], group.title)}
            </SidebarMenu>
          </React.Fragment>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
