import { Button } from "@/components/ui/button";
import { Grid3X3, LayoutList, Focus, Columns2, Grid2X2 } from "lucide-react";

export type LayoutMode = "grid" | "spotlight" | "speaker" | "sidebar" | "focus";

interface MeetingLayoutSelectorProps {
  currentLayout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
}

const layouts: Array<{
  id: LayoutMode;
  name: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: "grid",
    name: "Grid",
    icon: <Grid3X3 className="h-4 w-4" />,
    description: "Equal tiles for all participants",
  },
  {
    id: "spotlight",
    name: "Spotlight",
    icon: <Focus className="h-4 w-4" />,
    description: "Large speaker + thumbnails",
  },
  {
    id: "speaker",
    name: "Speaker",
    icon: <LayoutList className="h-4 w-4" />,
    description: "Full-width active speaker",
  },
  {
    id: "sidebar",
    name: "Sidebar",
    icon: <Columns2 className="h-4 w-4" />,
    description: "Main + side panel",
  },
  {
    id: "focus",
    name: "Focus",
    icon: <Grid2X2 className="h-4 w-4" />,
    description: "Your view centered",
  },
];

export function MeetingLayoutSelector({
  currentLayout,
  onLayoutChange,
}: MeetingLayoutSelectorProps) {
  return (
    <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
      {layouts.map((layout) => (
        <Button
          key={layout.id}
          variant={currentLayout === layout.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onLayoutChange(layout.id)}
          title={layout.description}
          className="text-xs gap-1"
        >
          {layout.icon}
          <span className="hidden sm:inline">{layout.name}</span>
        </Button>
      ))}
    </div>
  );
}
