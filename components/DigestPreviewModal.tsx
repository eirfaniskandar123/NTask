"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DigestPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DigestPreviewModal({ open, onOpenChange }: DigestPreviewModalProps) {
  const [html, setHtml] = useState("");
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/digest/preview");
    if (res.ok) {
      const data = await res.json();
      setHtml(data.html);
      setTaskCount(data.taskCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
    else { setHtml(""); setTaskCount(null); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>Email digest preview</DialogTitle>
            <div className="flex items-center gap-2">
              {taskCount !== null && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
              )}
              <button
                onClick={load}
                disabled={loading}
                className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {loading && !html ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-gray-500">
              Loading preview…
            </div>
          ) : taskCount === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-gray-500">
              No pending tasks for today — email would be skipped.
            </div>
          ) : (
            <iframe
              srcDoc={html}
              className="w-full rounded-lg"
              style={{ height: "520px", border: "none" }}
              title="Email preview"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
