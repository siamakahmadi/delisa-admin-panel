"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Youtube from "@tiptap/extension-youtube";
import Typography from "@tiptap/extension-typography";
import Focus from "@tiptap/extension-focus";
import { common, createLowlight } from "lowlight";
import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Lightbulb,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Video as YoutubeIcon,
  ShoppingBag,
} from "lucide-react";

import { uploadBlogImage, resolveProductEmbed } from "@/lib/blog/api";
import { ProductEmbed } from "./extensions/product-embed";
import { Callout } from "./extensions/callout";
import { SlashCommand } from "./extensions/slash-command";
import { SlashMenuList } from "./slash-menu-list";
import { Toolbar } from "./toolbar";
import { EditorBubbleMenu } from "./bubble-menu";

const lowlight = createLowlight(common);

const PRODUCT_URL_PATTERN = /^https?:\/\/\S+$/i;
const YOUTUBE_PATTERN = /(youtube\.com|youtu\.be)/i;

function defaultAltFromFilename(name) {
  if (!name) return "";
  return name.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[-_]+/g, " ").trim();
}

function promptImageAlt(defaultValue) {
  const alt = window.prompt("متن جایگزین تصویر (Alt) را وارد کنید — برای سئوی تصویر مهم است:", defaultValue || "");
  return alt === null ? defaultValue || "" : alt;
}

function debounce(fn, delay) {
  let t = null;
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}

function buildSlashItems({ onImage, onYoutube, onCallout, onProduct }) {
  return [
    { title: "تیتر ۱", icon: Heading1, group: "بلوک متنی", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run() },
    { title: "تیتر ۲", icon: Heading2, group: "بلوک متنی", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run() },
    { title: "تیتر ۳", icon: Heading3, group: "بلوک متنی", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run() },
    { title: "پاراگراف", icon: Pilcrow, group: "بلوک متنی", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("paragraph").run() },
    { title: "لیست نقطه‌ای", icon: List, group: "لیست‌ها", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
    { title: "لیست شماره‌دار", icon: ListOrdered, group: "لیست‌ها", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
    { title: "چک‌لیست", icon: ListChecks, group: "لیست‌ها", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run() },
    { title: "نقل قول", icon: Quote, group: "بلوک متنی", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
    { title: "بلوک کد", icon: Code2, group: "بلوک متنی", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
    {
      title: "جعبه یادداشت",
      icon: Lightbulb,
      description: "نکته / هشدار / موفقیت",
      group: "بلوک متنی",
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setCallout({ variant: "info" }).run(),
    },
    { title: "خط جداکننده", icon: Minus, group: "بلوک متنی", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
    {
      title: "جدول",
      icon: TableIcon,
      group: "رسانه",
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "تصویر",
      icon: ImageIcon,
      group: "رسانه",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onImage();
      },
    },
    {
      title: "ویدیوی یوتیوب",
      icon: YoutubeIcon,
      group: "رسانه",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onYoutube();
      },
    },
    {
      title: "کارت محصول",
      icon: ShoppingBag,
      description: "لینک محصول دلیسا را جای‌گذاری کنید",
      group: "رسانه",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onProduct();
      },
    },
  ];
}

function findNodePosByTempId(state, tempId) {
  let pos = null;
  state.doc.descendants((node, p) => {
    if (pos !== null) return false;
    if (node.type.name === "productEmbed" && node.attrs.tempId === tempId) {
      pos = p;
      return false;
    }
    return true;
  });
  return pos;
}

export const BlogEditor = forwardRef(function BlogEditor({ content, onChange, editable = true, placeholder }, ref) {
  const fileInputRef = useRef(null);
  const debouncedEmitRef = useRef(null);
  const slashHandlersRef = useRef({});
  const slashRendererRef = useRef(null);
  const slashListRef = useRef(null);
  const [focusMode, setFocusMode] = useState(false);

  const emit = useCallback(
    (editorInstance) => {
      if (!onChange || !editorInstance) return;
      const json = editorInstance.getJSON();
      const html = editorInstance.getHTML();
      const text = editorInstance.getText();
      const words = editorInstance.storage.characterCount?.words() ?? text.trim().split(/\s+/).filter(Boolean).length;
      onChange({ json, html, text, wordCount: words, readingTimeMinutes: Math.max(1, Math.ceil(words / 200)) });
    },
    [onChange]
  );

  if (!debouncedEmitRef.current) {
    debouncedEmitRef.current = debounce((editorInstance) => emit(editorInstance), 500);
  }

  const uploadImageFile = useCallback(async (file) => {
    if (!file || !file.type?.startsWith("image/")) return null;
    try {
      const res = await uploadBlogImage(file);
      const url = res?.url || res?.raw?.url || null;
      if (!url) return null;
      const alt = promptImageAlt(defaultAltFromFilename(file.name));
      return { url, alt };
    } catch (err) {
      window.alert(err?.response?.data?.message || "خطا در آپلود تصویر");
      return null;
    }
  }, []);

  const resolveProductUrl = useCallback(async (editorInstance, url, atRange) => {
    const tempId = `t_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const chain = editorInstance.chain().focus();
    if (atRange) chain.deleteRange(atRange);
    chain.insertContent({ type: "productEmbed", attrs: { tempId, loading: true } }).run();

    try {
      const snap = await resolveProductEmbed(url);
      if (!snap) throw new Error("snapshot خالی است");

      editorInstance.commands.command(({ tr, state }) => {
        const pos = findNodePosByTempId(state, tempId);
        if (pos === null) return false;
        tr.setNodeMarkup(pos, undefined, {
          tempId,
          productId: snap.productId || null,
          title: snap.title || snap.productName || "",
          slug: snap.slug || "",
          image: snap.image || "",
          price: Number(snap.price) || 0,
          finalPrice: Number(snap.finalPrice) || Number(snap.price) || 0,
          available: snap.available !== false,
          brandName: snap.brandName || null,
        });
        return true;
      });
    } catch (err) {
      editorInstance.commands.command(({ tr, state }) => {
        const pos = findNodePosByTempId(state, tempId);
        if (pos === null) return false;
        tr.setNodeMarkup(pos, undefined, { tempId, error: true, errorMessage: err?.response?.data?.message || "محصول پیدا نشد یا لینک نامعتبر است." });
        return true;
      });
    }
  }, []);

  const requestImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const insertYoutube = useCallback((editorInstance) => {
    const url = window.prompt("آدرس ویدیوی یوتیوب را وارد کنید:");
    if (!url) return;
    editorInstance.chain().focus().setYoutubeVideo({ src: url }).run();
  }, []);

  const insertProductPrompt = useCallback(
    (editorInstance) => {
      const url = window.prompt("لینک محصول دلیسا را وارد کنید:");
      if (!url) return;
      resolveProductUrl(editorInstance, url, null);
    },
    [resolveProductUrl]
  );

  const insertCallout = useCallback((editorInstance) => {
    editorInstance.chain().focus().setCallout({ variant: "info" }).run();
  }, []);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable,
      editorProps: {
        attributes: { class: "bx-prose", dir: "rtl", spellCheck: "true" },
        handlePaste: (view, event) => {
          const text = event.clipboardData?.getData("text/plain") || "";
          const trimmed = text.trim();

          const imageFile = Array.from(event.clipboardData?.files || []).find((f) => f.type?.startsWith("image/"));
          if (imageFile) {
            event.preventDefault();
            uploadImageFile(imageFile).then((img) => {
              if (img) editor?.chain().focus().setImage({ src: img.url, alt: img.alt }).run();
            });
            return true;
          }

          if (!trimmed || !PRODUCT_URL_PATTERN.test(trimmed) || trimmed !== text.trim()) return false;
          if (YOUTUBE_PATTERN.test(trimmed)) return false;

          event.preventDefault();
          resolveProductUrl(editor, trimmed, null);
          return true;
        },
        handleDrop: (view, event) => {
          const file = Array.from(event.dataTransfer?.files || []).find((f) => f.type?.startsWith("image/"));
          if (!file) return false;
          event.preventDefault();
          uploadImageFile(file).then((img) => {
            if (!img || !editor) return;
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const pos = coords ? coords.pos : editor.state.selection.from;
            editor.chain().focus().insertContentAt(pos, { type: "image", attrs: { src: img.url, alt: img.alt } }).run();
          });
          return true;
        },
      },
      extensions: [
        StarterKit.configure({ codeBlock: false, link: false }),
        Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
        Image.configure({ HTMLAttributes: { loading: "lazy" } }),
        Underline,
        Placeholder.configure({ placeholder: ({ node }) => (node.type.name === "heading" ? "تیتر…" : placeholder || "برای شروع بنویسید، یا / را برای دستورات فشار دهید…") }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Highlight.configure({ multicolor: false }),
        TextStyle,
        Color,
        Subscript,
        Superscript,
        TableKit.configure({ table: { resizable: true } }),
        TaskList,
        TaskItem.configure({ nested: true }),
        CharacterCount,
        CodeBlockLowlight.configure({ lowlight }),
        Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: "bx-youtube" } }),
        Typography,
        Focus.configure({ className: "bx-focused", mode: "shallowest" }),
        ProductEmbed,
        Callout,
        SlashCommand(slashHandlersRef),
      ],
      content: content || "",
      onUpdate: ({ editor: editorInstance }) => {
        debouncedEmitRef.current(editorInstance);
      },
    },
    []
  );

  slashHandlersRef.current = useMemo(
    () => ({
      getItems: (query) => {
        const all = buildSlashItems({
          onImage: requestImageUpload,
          onYoutube: () => editor && insertYoutube(editor),
          onCallout: () => editor && insertCallout(editor),
          onProduct: () => editor && insertProductPrompt(editor),
        });
        if (!query) return all;
        const q = query.toLowerCase();
        return all.filter((i) => i.title.toLowerCase().includes(q));
      },
      onStart: (props) => {
        slashRendererRef.current = new ReactRenderer(SlashMenuList, {
          props: { items: props.items, command: (item) => item.command({ editor: props.editor, range: props.range }) },
          editor: props.editor,
        });
        positionSlashMenu(slashRendererRef.current.element, props.clientRect);
        document.body.appendChild(slashRendererRef.current.element);
        slashListRef.current = slashRendererRef.current.ref;
      },
      onUpdate: (props) => {
        slashRendererRef.current?.updateProps({ items: props.items, command: (item) => item.command({ editor: props.editor, range: props.range }) });
        positionSlashMenu(slashRendererRef.current?.element, props.clientRect);
        slashListRef.current = slashRendererRef.current?.ref;
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          slashRendererRef.current?.destroy();
          slashRendererRef.current?.element?.remove();
          return true;
        }
        return slashListRef.current?.onKeyDown(props) || false;
      },
      onExit: () => {
        slashRendererRef.current?.element?.remove();
        slashRendererRef.current?.destroy();
        slashRendererRef.current = null;
      },
    }),
    [editor, requestImageUpload, insertYoutube, insertCallout, insertProductPrompt]
  );

  useEffect(() => {
    return () => {
      debouncedEmitRef.current?.cancel();
      slashRendererRef.current?.element?.remove();
      slashRendererRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable);
  }, [editor, editable]);

  // `content` is only the *initial* value (uncontrolled editor). When the
  // parent loads a post asynchronously (edit page), it arrives after this
  // component has already mounted with content=null — hydrate once when it
  // shows up, then stop watching so live edits are never stomped.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!editor || hydratedRef.current) return;
    const hasContent = content && (typeof content !== "object" || Object.keys(content).length > 0);
    if (hasContent) {
      editor.commands.setContent(content, { emitUpdate: false });
      hydratedRef.current = true;
    }
  }, [editor, content]);

  useImperativeHandle(
    ref,
    () => ({
      getSnapshot: () => {
        if (!editor) return null;
        const json = editor.getJSON();
        const html = editor.getHTML();
        const text = editor.getText();
        const words = editor.storage.characterCount?.words() ?? text.trim().split(/\s+/).filter(Boolean).length;
        return { json, html, text, wordCount: words, readingTimeMinutes: Math.max(1, Math.ceil(words / 200)) };
      },
      focus: () => editor?.chain().focus().run(),
      isEmpty: () => editor?.isEmpty ?? true,
      // explicit overwrite (e.g. restoring a revision) — unlike the
      // async-hydration effect above, this always replaces current content
      setContent: (json) => {
        if (!editor) return;
        editor.commands.setContent(json, { emitUpdate: false });
        hydratedRef.current = true;
        emit(editor);
      },
    }),
    [editor, emit]
  );

  const onFilePicked = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor) return;
      const img = await uploadImageFile(file);
      if (img) editor.chain().focus().setImage({ src: img.url, alt: img.alt }).run();
    },
    [editor, uploadImageFile]
  );

  const words = editor?.storage.characterCount?.words() ?? 0;
  const characters = editor?.storage.characterCount?.characters() ?? 0;

  return (
    <div className={cnEditor(focusMode)}>
      {editable && (
        <Toolbar
          editor={editor}
          onRequestImage={requestImageUpload}
          onInsertYoutube={() => editor && insertYoutube(editor)}
          onInsertCallout={() => editor && insertCallout(editor)}
          onInsertProduct={() => editor && insertProductPrompt(editor)}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((s) => !s)}
        />
      )}

      {editable && <EditorBubbleMenu editor={editor} />}

      <div className="bx-editor__canvas">
        <EditorContent editor={editor} />
      </div>

      {editable && (
        <div className="flex items-center gap-3 border-t border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--text-faint)]">
          <span>{words.toLocaleString("fa-IR")} کلمه</span>
          <span>{characters.toLocaleString("fa-IR")} نویسه</span>
          <span>{Math.max(1, Math.ceil(words / 200)).toLocaleString("fa-IR")} دقیقه مطالعه</span>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
    </div>
  );
});

function cnEditor(focusMode) {
  return `bx-editor rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden${focusMode ? " bx-editor--focus" : ""}`;
}

function positionSlashMenu(el, clientRect) {
  if (!el || !clientRect) return;
  const rect = clientRect();
  if (!rect) return;
  el.style.position = "fixed";
  el.style.zIndex = "1000";
  el.style.top = `${rect.bottom + 6}px`;
  el.style.left = `${Math.max(8, rect.left)}px`;
}
