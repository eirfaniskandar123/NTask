"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isFuture, parseISO } from "date-fns";
import { toast } from "sonner";
import { Task, Tag, Priority } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { TaskList } from "./TaskList";
import { AddTaskForm } from "./AddTaskForm";

export type ViewType = "all" | "today" | "upcoming" | "recurring" | "completed" | string;

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeView, setActiveView] = useState<ViewType>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, []);

  const fetchTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    if (res.ok) setTags(await res.json());
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTags();
  }, [fetchTasks, fetchTags]);

  const handleToggleDone = async (task: Task) => {
    const updated = { done: !task.done };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    toast.success(updated.done ? "Task marked done" : "Task reopened", { duration: 2000 });
    await fetchTasks();
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    toast.success("Task deleted", { duration: 2000 });
  };

  const handleEdit = async (id: string, updates: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    toast.success("Task updated", { duration: 2000 });
    await fetchTasks();
  };

  const handleAddTask = async (input: {
    title: string;
    note: string;
    priority: Priority;
    category: string;
    due_date: string | null;
    everyday: boolean;
  }) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      setShowAddForm(false);
      toast.success("Task added");
      await fetchTasks();
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const filteredTasks = tasks.filter((task) => {
    let passesView = false;
    switch (activeView) {
      case "all":       passesView = true; break;
      case "today":     passesView = task.everyday || (task.due_date !== null && task.due_date === todayStr); break;
      case "upcoming":  passesView = task.due_date !== null && isFuture(parseISO(task.due_date + "T00:00:00")) && task.due_date !== todayStr; break;
      case "recurring": passesView = task.everyday; break;
      case "completed": passesView = task.done; break;
      default:          passesView = task.category === activeView;
    }
    if (!passesView) return false;
    if (priorityFilter !== "all" && activeView !== "completed") return task.priority === priorityFilter;
    return true;
  });

  const counts = {
    all:       tasks.length,
    today:     tasks.filter((t) => !t.done && (t.everyday || (t.due_date !== null && t.due_date === todayStr))).length,
    upcoming:  tasks.filter((t) => !t.done && t.due_date !== null && isFuture(parseISO(t.due_date + "T00:00:00")) && t.due_date !== todayStr).length,
    recurring: tasks.filter((t) => !t.done && t.everyday).length,
    completed: tasks.filter((t) => t.done).length,
  };

  const doneTasks = filteredTasks.filter((t) => t.done);
  const totalFiltered = filteredTasks.length;
  const doneCount = doneTasks.length;

  const staticLabels: Record<string, string> = {
    all: "All tasks", today: "Today", upcoming: "Upcoming",
    recurring: "Recurring", completed: "Completed",
  };
  const viewLabel = staticLabels[activeView] ?? activeView;

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      <Sidebar
        activeView={activeView}
        setActiveView={(v) => { setActiveView(v); setPriorityFilter("all"); }}
        counts={counts}
        tags={tags}
        onTagsChange={fetchTags}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div>
            <h1 className="text-base font-medium text-gray-900 dark:text-gray-100">{viewLabel}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            + Add task
          </button>
        </div>

        {activeView !== "completed" && (
          <div className="flex gap-2 px-8 pb-3">
            {(["all", "high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  priorityFilter === p
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="px-8 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-all"
                style={{ width: totalFiltered > 0 ? `${(doneCount / totalFiltered) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{doneCount} / {totalFiltered} done</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Loading tasks…</div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              tags={tags}
              onToggleDone={handleToggleDone}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}

          {showAddForm && (
            <div className="mt-4">
              <AddTaskForm
                tags={tags}
                onAdd={handleAddTask}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {!loading && filteredTasks.length === 0 && !showAddForm && (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-12 text-center">No tasks here. Add one above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
