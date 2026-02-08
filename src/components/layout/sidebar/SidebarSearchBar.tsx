import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, useSidebar } from "@/components/ui/sidebar";
import type { NavItem } from "./sidebarNavData";

interface SidebarSearchBarProps {
  allItems: NavItem[];
}

export function SidebarSearchBar({ allItems }: SidebarSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return allItems.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [query, allItems]);

  if (isCollapsed) return null;

  return (
    <SidebarGroup className="px-3 pt-0 pb-1">
      <SidebarGroupContent>
        <div className="relative">
          <div
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-300 ${
              isFocused
                ? "border-sidebar-ring bg-sidebar-accent/80 shadow-[0_0_0_1px_hsl(var(--sidebar-ring)/0.3)]"
                : "border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent/50"
            }`}
          >
            <Search className="h-3.5 w-3.5 text-sidebar-foreground/40 flex-shrink-0" />
            <input
              type="text"
              placeholder="Quick find…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => { setIsFocused(false); setQuery(""); }, 200)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results.length > 0) {
                  navigate(results[0].url);
                  setQuery("");
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="flex-1 bg-transparent outline-none text-sidebar-foreground placeholder:text-sidebar-foreground/30 text-xs"
            />
            {!query && (
              <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-sidebar-border bg-sidebar-accent/50 px-1 font-mono text-[9px] text-sidebar-foreground/30">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Search results dropdown */}
          {isFocused && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-sidebar-border bg-sidebar p-1 shadow-lg z-50 animate-scale-in">
              {results.map((item) => (
                <button
                  key={item.url}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-150"
                  onMouseDown={() => {
                    navigate(item.url);
                    setQuery("");
                  }}
                >
                  <item.icon className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
