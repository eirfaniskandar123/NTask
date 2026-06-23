"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Notes (optional)",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const current = editor.getHTML();
      const incoming = content || "";
      if (current !== incoming && (incoming === "" || current === "<p></p>")) {
        editor.commands.setContent(incoming);
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus-within:ring-1 focus-within:ring-gray-400 dark:focus-within:ring-gray-500 transition-shadow">
      <div className="flex gap-0.5 px-2 py-1 border-b border-gray-100 dark:border-gray-700">
        {[
          { action: () => editor.chain().focus().toggleBold().run(), icon: <Bold size={12} />, active: editor.isActive("bold"), title: "Bold" },
          { action: () => editor.chain().focus().toggleItalic().run(), icon: <Italic size={12} />, active: editor.isActive("italic"), title: "Italic" },
          { action: () => editor.chain().focus().toggleBulletList().run(), icon: <List size={12} />, active: editor.isActive("bulletList"), title: "Bullet list" },
          { action: () => editor.chain().focus().toggleOrderedList().run(), icon: <ListOrdered size={12} />, active: editor.isActive("orderedList"), title: "Ordered list" },
        ].map(({ action, icon, active, title }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={action}
            className={cn(
              "p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors",
              active && "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            )}
          >
            {icon}
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 text-sm min-h-[80px] max-h-[200px] overflow-y-auto text-gray-900 dark:text-gray-100"
      />
    </div>
  );
}
