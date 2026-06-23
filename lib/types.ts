export type Priority = "high" | "medium" | "low";
export type Category = string;

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  note: string | null;
  priority: Priority;
  category: Category;
  due_date: string | null;
  everyday: boolean;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = {
  title: string;
  note?: string;
  priority?: Priority;
  category?: Category;
  due_date?: string | null;
  everyday?: boolean;
};

export type UpdateTaskInput = Partial<Omit<Task, "id" | "created_at" | "updated_at">>;
