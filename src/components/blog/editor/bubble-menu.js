"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, Link2, Eraser, Type } from "lucide-react";
import { cn } from "@/lib/utils";

function BubbleBtn({ active, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-white/80 hover:bg-white/10 hover:text-white", active && "bg-white/15 text-white")}
    >
      {children}
    </button>
  );
}

export function EditorBubbleMenu({ editor }) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("آدرس لینک را وارد کنید:", prev);
    if (url === null) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const editImageAlt = () => {
    const prev = editor.getAttributes("image").alt || "";
    const alt = window.prompt("متن جایگزین تصویر (Alt) را وارد کنید — برای سئوی تصویر مهم است:", prev);
    if (alt === null) return;
    editor.chain().focus().updateAttributes("image", { alt }).run();
  };

  const isImage = editor.isActive("image");

  return (
    <BubbleMenu editor={editor} shouldShow={({ from, to, editor: ed }) => from !== to && ed.isEditable}>
      <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] bg-[#1f2430] p-1 shadow-[var(--shadow-lg)]">
        {isImage ? (
          <BubbleBtn title="ویرایش متن جایگزین (Alt)" onClick={editImageAlt}>
            <Type size={14} />
          </BubbleBtn>
        ) : (
          <>
            <BubbleBtn active={editor.isActive("bold")} title="ضخیم" onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={14} />
            </BubbleBtn>
            <BubbleBtn active={editor.isActive("italic")} title="مورب" onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic size={14} />
            </BubbleBtn>
            <BubbleBtn active={editor.isActive("underline")} title="زیرخط" onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon size={14} />
            </BubbleBtn>
            <BubbleBtn active={editor.isActive("strike")} title="خط‌خورده" onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough size={14} />
            </BubbleBtn>
            <span className="mx-0.5 h-4 w-px bg-white/15" />
            <BubbleBtn active={editor.isActive("highlight")} title="هایلایت" onClick={() => editor.chain().focus().toggleHighlight().run()}>
              <Highlighter size={14} />
            </BubbleBtn>
            <BubbleBtn active={editor.isActive("link")} title="لینک" onClick={setLink}>
              <Link2 size={14} />
            </BubbleBtn>
            <span className="mx-0.5 h-4 w-px bg-white/15" />
            <BubbleBtn title="پاک‌کردن قالب‌بندی" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
              <Eraser size={14} />
            </BubbleBtn>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
