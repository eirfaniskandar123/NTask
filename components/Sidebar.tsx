"use client";

import { ViewType } from "./TaskManager";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutList,
  CalendarDays,
  CalendarArrowUp,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

const categories = [
  { key: "Dev", label: "Dev", color: "#534AB7" },
  { key: "Design", label: "Design", color: "#0F6E56" },
  { key: "Meeting", label: "Meeting", color: "#993C1D" },
  { key: "Personal", label: "Personal", color: "#854F0B" },
] as const;

const navItems = [
  { key: "all", label: "All tasks", icon: LayoutList },
  { key: "today", label: "Today", icon: CalendarDays },
  { key: "upcoming", label: "Upcoming", icon: CalendarArrowUp },
  { key: "recurring", label: "Recurring", icon: RefreshCw },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (v: ViewType) => void;
  counts: Record<string, number>;
}

export function Sidebar({ activeView, setActiveView, counts }: SidebarProps) {
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
                onClick={() => setActiveView(key as ViewType)}
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
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 min-w-[16px] px-1"
                  >
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
            {categories.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as ViewType)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeView === key
                    ? "bg-gray-200 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 pb-4">
          <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
            <p className="text-[11px] text-blue-600 font-medium">
              Email digest: 8:00 AM
            </p>
            <p className="text-[10px] text-blue-400 mt-0.5">Weekdays only</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex">
        {navItems.slice(0, 4).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as ViewType)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
              activeView === key
                ? "text-gray-900 font-medium"
                : "text-gray-400"
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
