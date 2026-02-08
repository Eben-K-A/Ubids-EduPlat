import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarNavGroup } from "./sidebar/SidebarNavGroup";
import { SidebarSearchBar } from "./sidebar/SidebarSearchBar";
import { SidebarUserCard } from "./sidebar/SidebarUserCard";
import {
  mainNavItems,
  lecturerNavItems,
  studentNavItems,
  communicationItems,
  toolsItems,
  adminNavItems,
} from "./sidebar/sidebarNavData";

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isAdmin = user?.role === "admin";
  const isLecturer = user?.role === "lecturer";

  const roleLabel = isLecturer || isAdmin ? "Teaching" : "Learning";
  const roleItems = isLecturer || isAdmin ? lecturerNavItems : studentNavItems;

  const allSearchableItems = useMemo(() => {
    const base = [...mainNavItems, ...roleItems, ...communicationItems, ...toolsItems];
    if (isAdmin) base.push(...adminNavItems);
    return base;
  }, [roleItems, isAdmin]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary flex-shrink-0 shadow-glow transition-shadow duration-500 hover:shadow-[0_0_24px_hsl(243_75%_59%/0.5)]">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <span className="text-lg font-bold text-sidebar-foreground tracking-tight">UBIDS EduPlat</span>
              <p className="text-[10px] text-sidebar-foreground/40 -mt-0.5 font-medium">Learning Management</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Quick find */}
      <SidebarSearchBar allItems={allSearchableItems} />

      <SidebarContent className="sidebar-scroll">
        <SidebarNavGroup label="Main" items={mainNavItems} defaultOpen />
        <SidebarSeparator className="opacity-30" />
        <SidebarNavGroup label={roleLabel} items={roleItems} defaultOpen />
        <SidebarSeparator className="opacity-30" />
        <SidebarNavGroup label="Communication" items={communicationItems} defaultOpen />
        <SidebarSeparator className="opacity-30" />
        <SidebarNavGroup label="Tools & Insights" items={toolsItems} />

        {isAdmin && (
          <>
            <SidebarSeparator className="opacity-30" />
            <SidebarNavGroup label="Administration" items={adminNavItems} />
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="pb-3">
        <SidebarSeparator className="opacity-30 mb-1" />
        <SidebarUserCard user={user} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  );
}
