import { Link } from "react-router-dom";
import { Bell, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from "../Navbar";

const DashboardHeader = () => {
  return <Navbar />;
};

export default DashboardHeader;
