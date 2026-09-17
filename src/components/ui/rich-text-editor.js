"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImageIcon,
  Type,
  Undo2,
  Redo2,
  Heading2,
  Heading3,
  AlignRight,
  AlignCenter,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadBlogImage } from "@/lib/blog/api";

function defaultAltFromFilename(name) {
  if (!name) return "";
  return name.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[-_]+/g, " ").trim();
}

function promptImageAlt(defaultValue) {
  const alt = window.prompt("متن جایگزین تصویر (Alt) را وارد کنید — برای سئوی تصویر مهم است:", defaultValue || "");
  return alt === null ? defaultValue || "" : alt;
}

function ToolbarButton({ onClick, active, disabled, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-40",
        active && "bg-[var(--brand-50)] text-[var(--brand-600)]"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder = "محتوای تفصیلی را اینجا بنویسید...", disabled }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      onChange?.({ json: e.getJSON(), html: e.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "rte-content min-h-[160px] px-3 py-2.5 text-sm outline-none text-[var(--text)]",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("آدرس لینک را وارد کنید", prev || "https://");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const onFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadBlogImage(file, "product-reviews");
      const url = res?.url || res?.raw?.url;
      if (url) {
        const alt = promptImageAlt(defaultAltFromFilename(file.name));
        editor.chain().focus().setImage({ src: url, alt }).run();
      }
    } finally {
      setUploading(false);
    }
  };

  const editImageAlt = () => {
    const prev = editor.getAttributes("image").alt || "";
    const alt = window.prompt("متن جایگزین تصویر (Alt) را وارد کنید — برای سئوی تصویر مهم است:", prev);
    if (alt === null) return;
    editor.chain().focus().updateAttributes("image", { alt }).run();
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] bg-[var(--surface-muted)] p-1.5">
        <ToolbarButton title="تیتر ۲" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="تیتر ۳" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={15} />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ToolbarButton title="ضخیم" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton title="ایتالیک" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton title="زیرخط" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ToolbarButton title="لیست نقطه‌ای" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton title="لیست شماره‌دار" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton title="نقل قول" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton title="لینک" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="افزودن تصویر" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="ویرایش متن جایگزین (Alt) تصویر" disabled={!editor.isActive("image")} onClick={editImageAlt}>
          <Type size={15} />
        </ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ToolbarButton title="راست‌چین" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarButton title="وسط‌چین" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton title="چپ‌چین" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={15} />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        <ToolbarButton title="واگرد" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="ازنو" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={15} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} dir="rtl" />
    </div>
  );
}
