"use client";

import { useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { Trash2, Calendar } from "lucide-react";
import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  Dev: "#534AB7",
  Design: "#0F6E56",
  Meeting: "#993C1D",
  Personal: "#854F0B",
};

const priorityConfig = {
  high: {
    bg: "#FCEBEB",
    text: "#A32D2D",
    label: "↑ High",
  },
  medium: {
    bg: "#FAEEDA",
    text: "#854F0B",
    label: "→ Medium",
  },
  low: {
    bg: "#EAF3DE",
    text: "#3B6D11",
    label: "↓ Low",
  },
};

interface TaskCardProps {
  task: Task;
  onToggleDone: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onToggleDone, onDelete }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const priority = priorityConfig[task.priority];
  const catColor = categoryColors[task.category] ?? "#888";

  const isOverdue =
    !task.done &&
    task.due_date !== null &&
    isPast(parseISO(task.due_date + "T23:59:59"));

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl border transition-all",
        task.done ? "opacity-50" : "",
        hovered ? "border-gray-300" : "border-gray-100"
      )}
      style={{ borderWidth: "0.5px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Circular checkbox */}
      <button
        onClick={() => onToggleDone(task)}
        className={cn(
          "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          task.done
            ? "bg-gray-900 border-gray-900"
            : "border-gray-300 hover:border-gray-500"
        )}
        aria-label={task.done ? "Mark undone" : "Mark done"}
      >
        {task.done && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-gray-900",
            task.done && "line-through text-gray-400"
          )}
        >
          {task.title}
        </p>

        {task.note && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.note}</p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {/* Priority */}
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: priority.bg, color: priority.text }}
          >
            {priority.label}
          </span>

          {/* Category */}
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: catColor }}
            />
            {task.category}
          </span>

          {/* Recurring */}
          {task.everyday && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#E6F1FB] text-[#185FA5]">
              ↺ Every weekday
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                isOverdue
                  ? "bg-[#FCEBEB] text-[#A32D2D]"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              <Calendar size={10} />
              {format(parseISO(task.due_date + "T00:00:00"), "MMM d")}
              {isOverdue && " · overdue"}
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className={cn(
          "flex-shrink-0 mt-0.5 p-1 rounded transition-all",
          confirmDelete
            ? "text-red-500 bg-red-50"
            : "text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100"
        )}
        aria-label="Delete task"
        title={confirmDelete ? "Click again to confirm" : "Delete"}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
