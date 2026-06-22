"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isToday, isFuture, isPast, parseISO } from "date-fns";
import { Task, Priority } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { TaskList } from "./TaskList";
import { AddTaskForm } from "./AddTaskForm";

export type ViewType = "all" | "today" | "upcoming" | "recurring" | "completed" | Category;
type Category = "Dev" | "Design" | "Meeting" | "Personal";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<ViewType>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleDone = async (task: Task) => {
    const updated = { done: !task.done };
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t))
    );
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    await fetchTasks();
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  };

  const handleAddTask = async (input: {
    title: string;
    note: string;
    priority: Priority;
    category: Category;
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
      await fetchTasks();
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const filteredTasks = tasks.filter((task) => {
    // View filter
    let passesView = false;
    switch (activeView) {
      case "all":
        passesView = true;
        break;
      case "today":
        passesView =
          task.everyday ||
          (task.due_date !== null && task.due_date === todayStr);
        break;
      case "upcoming":
        passesView =
          task.due_date !== null && isFuture(parseISO(task.due_date + "T00:00:00")) && task.due_date !== todayStr;
        break;
      case "recurring":
        passesView = task.everyday;
        break;
      case "completed":
        passesView = task.done;
        break;
      default:
        // Category view
        passesView = task.category === activeView;
    }

    if (!passesView) return false;

    // Priority filter (not applied to completed view)
    if (priorityFilter !== "all" && activeView !== "completed") {
      return task.priority === priorityFilter;
    }

    return true;
  });

  const counts = {
    all: tasks.length,
    today: tasks.filter(
      (t) =>
        !t.done &&
        (t.everyday || (t.due_date !== null && t.due_date === todayStr))
    ).length,
    upcoming: tasks.filter(
      (t) =>
        !t.done &&
        t.due_date !== null &&
        isFuture(parseISO(t.due_date + "T00:00:00")) &&
        t.due_date !== todayStr
    ).length,
    recurring: tasks.filter((t) => !t.done && t.everyday).length,
    completed: tasks.filter((t) => t.done).length,
  };

  const doneTasks = filteredTasks.filter((t) => t.done);
  const totalFiltered = filteredTasks.length;
  const doneCount = doneTasks.length;

  const viewLabel: Record<ViewType, string> = {
    all: "All tasks",
    today: "Today",
    upcoming: "Upcoming",
    recurring: "Recurring",
    completed: "Completed",
    Dev: "Dev",
    Design: "Design",
    Meeting: "Meeting",
    Personal: "Personal",
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          setPriorityFilter("all");
        }}
        counts={counts}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div>
            <h1 className="text-base font-medium text-gray-900">
              {viewLabel[activeView]}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Add task
          </button>
        </div>

        {/* Filter chips */}
        {activeView !== "completed" && (
          <div className="flex gap-2 px-8 pb-3">
            {(["all", "high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  priorityFilter === p
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="px-8 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all"
                style={{
                  width:
                    totalFiltered > 0
                      ? `${(doneCount / totalFiltered) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {doneCount} / {totalFiltered} done
            </span>
          </div>
        </div>

        {/* Task list + Add form */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="text-sm text-gray-400 py-8 text-center">
              Loading tasks…
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onToggleDone={handleToggleDone}
              onDelete={handleDelete}
            />
          )}

          {showAddForm && (
            <div className="mt-4">
              <AddTaskForm
                onAdd={handleAddTask}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {!loading && filteredTasks.length === 0 && !showAddForm && (
            <div className="text-sm text-gray-400 py-12 text-center">
              No tasks here. Add one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
