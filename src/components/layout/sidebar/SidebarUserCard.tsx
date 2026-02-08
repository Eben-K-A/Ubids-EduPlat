import { LogOut, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Settings, UserCircle, HelpCircle } from "lucide-react";
import type { User } from "@/types/auth";

interface SidebarUserCardProps {
  user: User | null;
  onLogout: () => void;
}

export function SidebarUserCard({ user, onLogout }: SidebarUserCardProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center p-1.5 mx-auto rounded-lg hover:bg-sidebar-accent/50 transition-colors duration-200">
            <Avatar className="h-7 w-7 ring-2 ring-sidebar-primary/30 transition-all duration-300 hover:ring-sidebar-primary/60">
              <AvatarFallback className="text-[10px] font-semibold bg-sidebar-primary text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <UserCircle className="mr-2 h-4 w-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/help")}>
            <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 w-full p-2.5 mx-1 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/60 border border-sidebar-border/50 transition-all duration-300 group cursor-pointer">
          <Avatar className="h-8 w-8 ring-2 ring-sidebar-primary/20 group-hover:ring-sidebar-primary/50 transition-all duration-300">
            <AvatarFallback className="text-xs font-semibold bg-sidebar-primary text-sidebar-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-sidebar-foreground/40 capitalize">{user?.role}</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors duration-200" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserCircle className="mr-2 h-4 w-4" /> My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/help")}>
          <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
