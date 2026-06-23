"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";
import { Calendar, RefreshCw, Plus, Trash2 } from "lucide-react";
import { Task, Tag, Subtask } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const priorityConfig = {
  high:   { bg: "#FCEBEB", text: "#A32D2D", label: "↑ High" },
  medium: { bg: "#FAEEDA", text: "#854F0B", label: "→ Medium" },
  low:    { bg: "#EAF3DE", text: "#3B6D11", label: "↓ Low" },
};

interface TaskDetailModalProps {
  task: Task | null;
  tags: Tag[];
  open: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, tags, open, onClose }: TaskDetailModalProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !task) { setSubtasks([]); setNewTitle(""); setPendingDeleteId(null); return; }
    fetch(`/api/subtasks?task_id=${task.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSubtasks(data); });
  }, [open, task?.id]);

  const addSubtask = async () => {
    if (!newTitle.trim() || !task || adding) return;
    setAdding(true);
    const res = await fetch("/api/subtasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, title: newTitle.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setSubtasks((prev) => [...prev, created]);
      setNewTitle("");
      toast.success("Subtask added");
      inputRef.current?.focus();
    }
    setAdding(false);
  };

  const toggleSubtask = async (s: Subtask) => {
    setSubtasks((prev) => prev.map((x) => x.id === s.id ? { ...x, done: !x.done } : x));
    await fetch(`/api/subtasks/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !s.done }),
    });
  };

  const confirmDelete = async (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    setPendingDeleteId(null);
    await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
    toast.success("Subtask deleted", { duration: 2000 });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addSubtask();
    if (e.key === "Escape") setNewTitle("");
  };

  if (!task) return null;

  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
  const tagObj = tags.find((t) => t.name === task.category);
  const catColor = tagObj?.color ?? "#888";

  const isOverdue =
    !task.done &&
    task.due_date !== null &&
    isPast(parseISO(task.due_date + "T23:59:59"));

  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "text-base font-semibold leading-snug pr-6",
              task.done && "line-through text-gray-400 dark:text-gray-500"
            )}
          >
            {task.title}
          </DialogTitle>
        </DialogHeader>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: priority.bg, color: priority.text }}
          >
            {priority.label}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
            {task.category}
          </span>

          {task.everyday && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#E6F1FB] text-[#185FA5] dark:bg-blue-950 dark:text-blue-300">
              <RefreshCw size={9} />
              Every weekday
            </span>
          )}

          {task.due_date && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              isOverdue
                ? "bg-[#FCEBEB] text-[#A32D2D] dark:bg-red-950 dark:text-red-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}>
              <Calendar size={10} />
              {format(parseISO(task.due_date + "T00:00:00"), "MMMM d, yyyy")}
              {isOverdue && " · overdue"}
            </span>
          )}

          {task.done && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              ✓ Completed
            </span>
          )}
        </div>

        {/* Note */}
        {task.note ? (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Note
            </p>
            <div
              className="note-preview text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: task.note }}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 italic">No note added.</p>
        )}

        {/* Subtasks */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Subtasks
            </p>
            {subtasks.length > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {doneCount} / {subtasks.length} done
              </span>
            )}
          </div>

          {subtasks.length > 0 && (
            <div className="space-y-0.5 mb-2">
              {subtasks.map((s) => {
                const isPending = pendingDeleteId === s.id;
                if (isPending) {
                  return (
                    <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
                      <span className="flex-1 text-xs text-red-700 dark:text-red-400 truncate">
                        Delete &ldquo;{s.title}&rdquo;?
                      </span>
                      <button
                        onClick={() => confirmDelete(s.id)}
                        className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 whitespace-nowrap"
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(null)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }
                return (
                  <div key={s.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <button
                      onClick={() => toggleSubtask(s)}
                      className={cn(
                        "flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                        s.done
                          ? "bg-gray-700 dark:bg-gray-300 border-gray-700 dark:border-gray-300"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400"
                      )}
                    >
                      {s.done && (
                        <svg className="w-2 h-2 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm",
                      s.done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {s.title}
                    </span>
                    <button
                      onClick={() => setPendingDeleteId(s.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all"
                      title="Delete subtask"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add subtask input */}
          <div className="flex items-center gap-2 mt-1 py-1 px-2">
            <Plus size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Add subtask…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 bg-transparent outline-none py-0.5"
            />
            {newTitle.trim() && (
              <button
                onClick={addSubtask}
                disabled={adding}
                className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
              >
                {adding ? "Adding…" : "Add"}
              </button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-4 text-[11px] text-gray-400 dark:text-gray-500">
          <span>Created {format(new Date(task.created_at), "MMM d, yyyy")}</span>
          {task.updated_at !== task.created_at && (
            <span>Updated {format(new Date(task.updated_at), "MMM d, yyyy")}</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
