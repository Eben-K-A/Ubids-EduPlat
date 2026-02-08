import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { NavItem } from "./sidebarNavData";

interface SidebarNavGroupProps {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export function SidebarNavGroup({ label, items, defaultOpen = true }: SidebarNavGroupProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;
  const hasActiveChild = items.some((item) => isActive(item.url));

  const [open, setOpen] = useState(defaultOpen || hasActiveChild);

  // When collapsed, render without collapsible wrapper
  if (isCollapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                  <NavLink to={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
                <MenuBadge item={item} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer select-none hover:text-sidebar-foreground transition-colors duration-200 pr-2">
            <span className="flex-1">{label}</span>
            <ChevronRight
              className={`h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform duration-300 ease-out ${
                open ? "rotate-90" : "rotate-0"
              }`}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>

        <CollapsibleContent className="sidebar-collapsible-content">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`sidebar-menu-item-animated ${
                        active ? "sidebar-active-item" : ""
                      }`}
                    >
                      <NavLink to={item.url}>
                        <item.icon className={`h-4 w-4 transition-colors duration-200 ${active ? "text-sidebar-primary" : ""}`} />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    <MenuBadge item={item} />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function MenuBadge({ item }: { item: NavItem }) {
  if (!item.badge || item.badge <= 0) return null;

  return (
    <SidebarMenuBadge>
      <Badge
        className={`h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${
          item.badgeVariant === "destructive"
            ? "bg-destructive text-destructive-foreground sidebar-badge-pulse"
            : item.badgeVariant === "warning"
            ? "bg-warning text-warning-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {item.badge}
      </Badge>
    </SidebarMenuBadge>
  );
}
