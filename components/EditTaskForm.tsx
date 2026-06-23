"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Priority, Task, Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { TiptapEditor } from "@/components/TiptapEditor";
import { cn } from "@/lib/utils";

interface EditTaskFormProps {
  task: Task;
  tags: Tag[];
  saving: boolean;
  onSave: (updates: Partial<Task>) => Promise<void>;
  onCancel: () => void;
}

export function EditTaskForm({ task, tags, saving, onSave, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [category, setCategory] = useState(task.category || (tags[0]?.name ?? ""));
  const [date, setDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date + "T00:00:00") : undefined
  );
  const [everyday, setEveryday] = useState(task.everyday);
  const [calOpen, setCalOpen] = useState(false);

  const handleSave = () => {
    if (!title.trim() || saving) return;
    onSave({
      title: title.trim(),
      note: note || null,
      priority,
      category,
      due_date: date ? format(date, "yyyy-MM-dd") : null,
      everyday,
    });
  };

  return (
    <div className="border border-blue-200 dark:border-blue-900 rounded-xl p-4 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
      <Input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
        autoFocus
        className="bg-white dark:bg-gray-800"
      />

      <TiptapEditor content={note} onChange={setNote} />

      <div className="flex gap-2 flex-wrap">
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="w-[110px] bg-white dark:bg-gray-800 text-sm h-9">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">↑ High</SelectItem>
            <SelectItem value="medium">→ Medium</SelectItem>
            <SelectItem value="low">↓ Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[130px] bg-white dark:bg-gray-800 text-sm h-9">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.name}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("h-9 px-3 font-normal bg-white dark:bg-gray-800 text-sm", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {date ? format(date, "MMM d, yyyy") : "Due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { setDate(d); setCalOpen(false); }}
              initialFocus
            />
            {date && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-gray-500"
                  onClick={() => { setDate(undefined); setCalOpen(false); }}
                >
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <Checkbox
          checked={everyday}
          onCheckedChange={(v) => setEveryday(!!v)}
          className="rounded-full"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">Notify every weekday</span>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!title.trim() || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
