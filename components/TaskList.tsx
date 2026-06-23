"use client";

import { Task, Tag } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  tags: Tag[];
  onToggleDone: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Task>) => Promise<void>;
}

export function TaskList({ tasks, tags, onToggleDone, onDelete, onEdit }: TaskListProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          tags={tags}
          onToggleDone={onToggleDone}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
