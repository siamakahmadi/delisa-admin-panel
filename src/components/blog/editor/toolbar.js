"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Palette,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Lightbulb,
  AlignJustify,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Video,
  ShoppingBag,
  Minus,
  Eraser,
  Undo2,
  Redo2,
  Focus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";

function Btn({ active, disabled, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] disabled:pointer-events-none disabled:opacity-40",
        active && "bg-[var(--brand-50)] text-[var(--brand-600)]"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-[var(--border)]" />;
}

const HEADING_OPTIONS = [
  { value: "p", label: "متن عادی" },
  { value: "1", label: "تیتر ۱" },
  { value: "2", label: "تیتر ۲" },
  { value: "3", label: "تیتر ۳" },
  { value: "4", label: "تیتر ۴" },
];

const ALIGN_OPTIONS = [
  { value: "right", label: "راست", icon: AlignRight },
  { value: "center", label: "وسط", icon: AlignCenter },
  { value: "left", label: "چپ", icon: AlignLeft },
  { value: "justify", label: "بلوکی", icon: AlignJustify },
];

export function Toolbar({ editor, onRequestImage, onInsertYoutube, onInsertCallout, onInsertProduct, focusMode, onToggleFocusMode }) {
  const colorInputRef = useRef(null);
  const [showAlign, setShowAlign] = useState(false);

  if (!editor) return null;

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : editor.isActive("heading", { level: 4 })
          ? "4"
          : "p";

  const setHeading = (value) => {
    if (value === "p") editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(value) }).run();
  };

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

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] bg-[var(--surface-muted)] p-1.5">
      <Select className="!h-7 !w-28 !text-xs" value={currentHeading} onChange={(e) => setHeading(e.target.value)} title="سطح تیتر">
        {HEADING_OPTIONS.map((h) => (
          <option key={h.value} value={h.value}>
            {h.label}
          </option>
        ))}
      </Select>

      <Divider />

      <Btn active={editor.isActive("bold")} title="ضخیم (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={14} />
      </Btn>
      <Btn active={editor.isActive("italic")} title="مورب (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={14} />
      </Btn>
      <Btn active={editor.isActive("underline")} title="زیرخط (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={14} />
      </Btn>
      <Btn active={editor.isActive("strike")} title="خط‌خورده" onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={14} />
      </Btn>
      <Btn active={editor.isActive("highlight")} title="هایلایت" onClick={() => editor.chain().focus().toggleHighlight().run()}>
        <Highlighter size={14} />
      </Btn>
      <Btn title="رنگ متن" onClick={() => colorInputRef.current?.click()}>
        <Palette size={14} />
        <input ref={colorInputRef} type="color" className="sr-only" onInput={(e) => editor.chain().focus().setColor(e.target.value).run()} />
      </Btn>

      <Divider />

      <Btn active={editor.isActive("bulletList")} title="لیست نقطه‌ای" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={14} />
      </Btn>
      <Btn active={editor.isActive("orderedList")} title="لیست شماره‌دار" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={14} />
      </Btn>
      <Btn active={editor.isActive("taskList")} title="چک‌لیست" onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListChecks size={14} />
      </Btn>
      <Btn active={editor.isActive("blockquote")} title="نقل قول" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={14} />
      </Btn>
      <Btn active={editor.isActive("codeBlock")} title="بلوک کد" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 size={14} />
      </Btn>

      <Divider />

      <div className="relative">
        <Btn
          active={editor.isActive({ textAlign: "center" }) || editor.isActive({ textAlign: "left" }) || editor.isActive({ textAlign: "justify" })}
          title="چینش متن"
          onClick={() => setShowAlign((s) => !s)}
        >
          <AlignRight size={14} />
        </Btn>
        {showAlign && (
          <div className="absolute top-full z-30 mt-1 flex gap-0.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-lg)]">
            {ALIGN_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Btn
                key={value}
                active={editor.isActive({ textAlign: value })}
                title={label}
                onClick={() => {
                  editor.chain().focus().setTextAlign(value).run();
                  setShowAlign(false);
                }}
              >
                <Icon size={14} />
              </Btn>
            ))}
          </div>
        )}
      </div>

      <Btn active={editor.isActive("link")} title="لینک" onClick={setLink}>
        <Link2 size={14} />
      </Btn>
      <Btn title="تصویر" onClick={onRequestImage}>
        <ImageIcon size={14} />
      </Btn>
      <Btn title="جدول" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <TableIcon size={14} />
      </Btn>
      <Btn title="ویدیوی یوتیوب" onClick={onInsertYoutube}>
        <Video size={14} />
      </Btn>
      <Btn title="جعبه یادداشت" onClick={onInsertCallout}>
        <Lightbulb size={14} />
      </Btn>
      <Btn title="کارت محصول" onClick={onInsertProduct}>
        <ShoppingBag size={14} />
      </Btn>

      <Divider />

      <Btn title="خط افقی" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={14} />
      </Btn>
      <Btn title="پاک‌کردن قالب‌بندی" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
        <Eraser size={14} />
      </Btn>

      <Divider />

      <Btn disabled={!editor.can().undo()} title="واگرد (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={14} />
      </Btn>
      <Btn disabled={!editor.can().redo()} title="ازنو (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={14} />
      </Btn>

      <Divider />

      <Btn active={focusMode} title="حالت تمرکز" onClick={onToggleFocusMode}>
        <Focus size={14} />
      </Btn>
    </div>
  );
}
