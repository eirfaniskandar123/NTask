"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Priority, Tag } from "@/lib/types";
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

interface AddTaskFormProps {
  tags: Tag[];
  onAdd: (input: {
    title: string;
    note: string;
    priority: Priority;
    category: string;
    due_date: string | null;
    everyday: boolean;
  }) => void;
  onCancel: () => void;
}

export function AddTaskForm({ tags, onAdd, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState(tags[0]?.name ?? "");

  // If tags weren't loaded when form mounted, set default once they arrive
  useEffect(() => {
    if (!category && tags.length > 0) setCategory(tags[0].name);
  }, [tags, category]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [everyday, setEveryday] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await onAdd({
      title,
      note,
      priority,
      category,
      due_date: date ? format(date, "yyyy-MM-dd") : null,
      everyday,
    });
    setSubmitting(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="space-y-3">
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
          className="bg-white"
        />

        <TiptapEditor content={note} onChange={setNote} />

        <div className="flex gap-2 flex-wrap">
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className="w-[110px] bg-white text-sm h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">↑ High</SelectItem>
              <SelectItem value="medium">→ Medium</SelectItem>
              <SelectItem value="low">↓ Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[130px] bg-white text-sm h-9">
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
                className={cn("h-9 px-3 font-normal bg-white text-sm", !date && "text-muted-foreground")}
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
          <span className="text-sm text-gray-600">Notify every weekday (no due date)</span>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || submitting}>
            {submitting ? "Adding…" : "Add task"}
          </Button>
        </div>
      </div>
    </div>
  );
}
