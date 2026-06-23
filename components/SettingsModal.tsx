"use client";

import { useState, useEffect } from "react";
import { Settings, Trash2, Plus, AlertCircle } from "lucide-react";
import { Tag } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_COLORS = [
  "#534AB7", "#0F6E56", "#993C1D", "#854F0B",
  "#185FA5", "#6B21A8", "#0E7490", "#9D174D",
  "#374151", "#B45309",
];

interface PendingDelete {
  tag: Tag;
  error?: string;
  deleting?: boolean;
}

interface SettingsModalProps {
  tags: Tag[];
  onTagsChange: () => void;
}

export function SettingsModal({ tags, onTagsChange }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"priority" | "tag">("priority");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.digest_sort_by === "tag" || s.digest_sort_by === "priority") {
          setSortBy(s.digest_sort_by);
        }
      });
  }, [open]);

  // Clear pending delete if dialog closes
  useEffect(() => {
    if (!open) setPendingDelete(null);
  }, [open]);

  const saveSortBy = async (val: "priority" | "tag") => {
    setSortBy(val);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "digest_sort_by", value: val }),
    });
  };

  const addTag = async () => {
    if (!newTagName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    });
    if (res.ok) {
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      onTagsChange();
    }
    setAdding(false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setPendingDelete({ ...pendingDelete, deleting: true, error: undefined });

    const res = await fetch(`/api/tags/${pendingDelete.tag.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      setPendingDelete({
        ...pendingDelete,
        deleting: false,
        error: data.error ?? "Failed to delete tag",
      });
      return;
    }

    setPendingDelete(null);
    onTagsChange();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        title="Settings"
      >
        <Settings size={14} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          {/* Email digest sort */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Email digest — sort by
            </p>
            <div className="flex gap-2">
              {(["priority", "tag"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => saveSortBy(opt)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    sortBy === opt
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {opt === "priority" ? "Priority (High → Low)" : "Tag"}
                </button>
              ))}
            </div>
          </div>

          {/* Tags management */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Tags
            </p>

            <div className="space-y-1 mb-3 max-h-[180px] overflow-y-auto">
              {tags.map((tag) => {
                const isPending = pendingDelete?.tag.id === tag.id;

                if (isPending) {
                  return (
                    <div key={tag.id} className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                      {pendingDelete.error ? (
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-700 flex-1">{pendingDelete.error}</p>
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs text-red-700 flex-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            Delete &ldquo;{tag.name}&rdquo;?
                          </span>
                          <button
                            onClick={confirmDelete}
                            disabled={pendingDelete.deleting}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {pendingDelete.deleting ? "Deleting…" : "Yes, delete"}
                          </button>
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 group"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </span>
                    <button
                      onClick={() => setPendingDelete({ tag })}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                      title="Delete tag"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add tag */}
            <div className="border border-gray-200 rounded-md p-3 space-y-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
                className="h-8 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      newTagColor === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <Button
                size="sm"
                className="w-full h-8 text-xs"
                disabled={!newTagName.trim() || adding}
                onClick={addTag}
              >
                <Plus size={12} className="mr-1" />
                {adding ? "Adding…" : "Add tag"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
