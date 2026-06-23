"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { ViewType } from "./TaskManager";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SettingsModal } from "./SettingsModal";
import { DigestPreviewModal } from "./DigestPreviewModal";
import {
  LayoutList,
  CalendarDays,
  CalendarArrowUp,
  RefreshCw,
  CheckCircle2,
  Settings,
  Mail,
  LogOut,
  ChevronUp,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

interface Stats {
  completedThisWeek: number;
  streak: number;
  total: number;
  done: number;
}

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
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, [counts]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[200px] flex-col h-full border-r border-gray-100 dark:border-gray-800 bg-[#F9F9F8] dark:bg-gray-900 flex-shrink-0">
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-3">
            My workspace
          </p>

          <nav className="space-y-0.5">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeView === key
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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

          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-3">
            Tags
          </p>
          <div className="space-y-0.5">
            {tags.map(({ id, name, color }) => (
              <button
                key={id}
                onClick={() => setActiveView(name)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeView === name
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          {stats && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md px-3 py-2">
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                <span>This week</span>
                {stats.streak > 0 && (
                  <span className="text-orange-500 font-medium">🔥 {stats.streak}d streak</span>
                )}
              </div>
              <div className="flex gap-3">
                <div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{stats.completedThisWeek}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">done</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{stats.total - stats.done}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">pending</span>
                </div>
              </div>
            </div>
          )}

          {/* Workspace dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                menuOpen
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Settings size={12} />
                Workspace
              </span>
              <ChevronUp
                size={12}
                className={`transition-transform duration-150 ${menuOpen ? "" : "rotate-180"}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings size={12} className="text-gray-400 dark:text-gray-500" />
                  Settings
                </button>
                <button
                  onClick={() => { setPreviewOpen(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Mail size={12} className="text-gray-400 dark:text-gray-500" />
                  Preview email
                </button>
                {/* Theme toggle row */}
                <div className="flex items-center gap-1 px-3 py-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">Theme</span>
                  {(["light", "dark", "system"] as const).map((t) => {
                    const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
                    return (
                      <button
                        key={t}
                        onClick={() => { setTheme(t); setMenuOpen(false); }}
                        title={t.charAt(0).toUpperCase() + t.slice(1)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          theme === t
                            ? "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                            : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <Icon size={12} />
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Modals */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tags={tags}
        onTagsChange={onTagsChange}
      />
      <DigestPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} />

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex">
        {navItems.slice(0, 4).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
              activeView === key ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-400 dark:text-gray-600"
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
