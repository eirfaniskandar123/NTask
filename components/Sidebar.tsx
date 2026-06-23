"use client";

import { useRouter } from "next/navigation";
import { ViewType } from "./TaskManager";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/lib/types";
import { SettingsModal } from "./SettingsModal";
import {
  LayoutList,
  CalendarDays,
  CalendarArrowUp,
  RefreshCw,
  CheckCircle2,
  LogOut,
} from "lucide-react";

const navItems = [
  { key: "all",       label: "All tasks",  icon: LayoutList },
  { key: "today",     label: "Today",      icon: CalendarDays },
  { key: "upcoming",  label: "Upcoming",   icon: CalendarArrowUp },
  { key: "recurring", label: "Recurring",  icon: RefreshCw },
  { key: "completed", label: "Completed",  icon: CheckCircle2 },
] as const;

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (v: ViewType) => void;
  counts: Record<string, number>;
  tags: Tag[];
  onTagsChange: () => void;
}

export function Sidebar({ activeView, setActiveView, counts, tags, onTagsChange }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[200px] flex-col h-full border-r border-gray-100 bg-[#F9F9F8] flex-shrink-0">
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-3">
            My workspace
          </p>

          <nav className="space-y-0.5">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeView === key
                    ? "bg-gray-200 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={14} />
                  {label}
                </span>
                {counts[key] > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 min-w-[16px] px-1">
                    {counts[key]}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          <Separator className="my-4" />

          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-3">
            Tags
          </p>
          <div className="space-y-0.5">
            {tags.map(({ id, name, color }) => (
              <button
                key={id}
                onClick={() => setActiveView(name)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeView === name
                    ? "bg-gray-200 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-2">
          <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
            <p className="text-[11px] text-blue-600 font-medium">Email digest: 8:00 AM</p>
            <p className="text-[10px] text-blue-400 mt-0.5">Weekdays only</p>
          </div>
          <div className="flex items-center justify-between px-1">
            <SettingsModal tags={tags} onTagsChange={onTagsChange} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              title="Sign out"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex">
        {navItems.slice(0, 4).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
              activeView === key ? "text-gray-900 font-medium" : "text-gray-400"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
