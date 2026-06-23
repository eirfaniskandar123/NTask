"use client";

import { useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { Trash2, Calendar, Pencil } from "lucide-react";
import { Task, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EditTaskForm } from "./EditTaskForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const priorityConfig = {
  high:   { bg: "#FCEBEB", text: "#A32D2D", label: "↑ High" },
  medium: { bg: "#FAEEDA", text: "#854F0B", label: "→ Medium" },
  low:    { bg: "#EAF3DE", text: "#3B6D11", label: "↓ Low" },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

interface TaskCardProps {
  task: Task;
  tags: Tag[];
  onToggleDone: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Task>) => Promise<void>;
}

export function TaskCard({ task, tags, onToggleDone, onDelete, onEdit }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
  const tagObj = tags.find((t) => t.name === task.category);
  const catColor = tagObj?.color ?? "#888";

  const isOverdue =
    !task.done &&
    task.due_date !== null &&
    isPast(parseISO(task.due_date + "T23:59:59"));

  const handleSave = async (updates: Partial<Task>) => {
    setSaving(true);
    try {
      await onEdit(task.id, updates);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <EditTaskForm
        task={task}
        tags={tags}
        saving={saving}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-all",
          task.done && "opacity-50"
        )}
        style={{ borderWidth: "0.5px" }}
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
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium text-gray-900", task.done && "line-through text-gray-400")}>
            {task.title}
          </p>

          {task.note && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {stripHtml(task.note)}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: priority.bg, color: priority.text }}
            >
              {priority.label}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
              {task.category}
            </span>

            {task.everyday && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#E6F1FB] text-[#185FA5]">
                ↺ Every weekday
              </span>
            )}

            {task.due_date && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                isOverdue ? "bg-[#FCEBEB] text-[#A32D2D]" : "bg-gray-100 text-gray-600"
              )}>
                <Calendar size={10} />
                {format(parseISO(task.due_date + "T00:00:00"), "MMM d")}
                {isOverdue && " · overdue"}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons — always visible, subtle until hovered */}
        <div className="flex-shrink-0 flex items-center gap-0.5 mt-0.5">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded text-gray-300 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Edit task"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete task"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              &ldquo;{task.title}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-5">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setDeleteOpen(false);
                onDelete(task.id);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
