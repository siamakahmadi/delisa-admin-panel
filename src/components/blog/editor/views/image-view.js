"use client";

import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, ImagePlus, Settings2, Square, Maximize, X } from "lucide-react";
import { uploadBlogImage } from "@/lib/blog/api";
import { LAYOUTS } from "../extensions/image-grid";

const SIZE_OPTIONS = [
  { value: "small", label: "کوچک" },
  { value: "medium", label: "متوسط" },
  { value: "large", label: "بزرگ" },
];

const ALIGN_OPTIONS = [
  { value: "right", icon: AlignRight, label: "راست، کنار متن" },
  { value: "center", icon: AlignCenter, label: "وسط، تمام عرض" },
  { value: "left", icon: AlignLeft, label: "چپ، کنار متن" },
];

const FIT_OPTIONS = [
  { value: "cover", icon: Maximize, label: "پر کردن قاب (برش بخورد)" },
  { value: "contain", icon: Square, label: "نمایش کامل عکس (بدون برش)" },
];

function defaultAltFromFilename(name) {
  if (!name) return "";
  return name.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[-_]+/g, " ").trim();
}

function findGridContext(editor, pos) {
  if (!editor || pos == null) return { inGrid: false };
  try {
    const $pos = editor.state.doc.resolve(pos);
    if ($pos.parent?.type?.name !== "imageGrid") return { inGrid: false };
    const layout = LAYOUTS[$pos.parent.attrs.layout] ? $pos.parent.attrs.layout : "row-2";
    return { inGrid: true, depth: $pos.depth, fixed: LAYOUTS[layout].fixed };
  } catch {
    return { inGrid: false };
  }
}

export function ImageView({ node, updateAttributes, deleteNode, editor, selected, getPos }) {
  const editable = !!editor?.isEditable;
  const { src, alt, size = "large", align = "center", caption = "", fit = "cover" } = node.attrs;
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [altDraft, setAltDraft] = useState(alt || "");
  const [captionDraft, setCaptionDraft] = useState(caption);
  const [captionOpen, setCaptionOpen] = useState(!!caption);

  useEffect(() => setAltDraft(alt || ""), [alt]);
  useEffect(() => {
    setCaptionDraft(caption);
    if (caption) setCaptionOpen(true);
  }, [caption]);

  const pos = typeof getPos === "function" ? getPos() : null;
  const { inGrid, fixed: inFixedLayout } = findGridContext(editor, pos);

  const uploadInto = async (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    setUploading(true);
    try {
      const res = await uploadBlogImage(file);
      const url = res?.url || res?.raw?.url;
      if (url) updateAttributes({ src: url, alt: alt || defaultAltFromFilename(file.name) });
    } catch (err) {
      window.alert(err?.response?.data?.message || "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    setOpen(false);
    if (inGrid) {
      // A "feature-*" layout is placed by CSS nth-child position — removing
      // a slot node would shift every image after it into the wrong cell,
      // so clear it back to an empty placeholder instead.
      if (inFixedLayout) {
        updateAttributes({ src: "", alt: "", caption: "", size: "large", align: "center", fit: "cover" });
        return;
      }
      const $pos = editor.state.doc.resolve(pos);
      const depth = $pos.depth;
      const parent = $pos.node(depth);
      editor.commands.command(({ tr }) => {
        if (parent.childCount <= 1) {
          const start = $pos.before(depth);
          tr.delete(start, start + parent.nodeSize);
        } else {
          tr.delete(pos, pos + parent.child($pos.index(depth)).nodeSize);
        }
        return true;
      });
      return;
    }
    deleteNode();
  };

  const removeSlot = () => {
    // Empty placeholder in a flexible gallery — only ever shown when
    // !fixed, so this always removes just this slot, never the gallery.
    const $pos = editor.state.doc.resolve(pos);
    const depth = $pos.depth;
    editor.commands.command(({ tr }) => {
      tr.delete(pos, pos + $pos.parent.child($pos.index(depth)).nodeSize);
      return true;
    });
  };

  const commitAlt = () => {
    if (altDraft !== (alt || "")) updateAttributes({ alt: altDraft });
  };
  const commitCaption = () => {
    if (captionDraft !== caption) updateAttributes({ caption: captionDraft });
  };

  const wrapperClass = [
    "bx-figure",
    `bx-figure--${size}`,
    `bx-figure--align-${align}`,
    `bx-figure--fit-${fit}`,
    selected ? "bx-figure--selected" : "",
    inGrid ? "bx-figure--in-grid" : "",
    !src ? "bx-figure--empty-slot" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!src) {
    return (
      <NodeViewWrapper className={wrapperClass} data-drag-handle>
        <button
          type="button"
          className="bx-figure__upload-btn"
          disabled={!editable || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus size={20} />
          <span>{uploading ? "در حال آپلود…" : "افزودن عکس"}</span>
        </button>
        {editable && inGrid && !inFixedLayout && (
          <button type="button" className="bx-figure__remove-slot" title="حذف این اسلات" onClick={removeSlot}>
            <X size={13} />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            uploadInto(file);
          }}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className={wrapperClass} data-drag-handle>
      {editable && (
        <button type="button" className="bx-figure__gear" title="تنظیمات تصویر" onClick={() => setOpen((s) => !s)}>
          <Settings2 size={13} />
        </button>
      )}

      <div className="bx-figure__frame">
        <img src={src} alt={alt || ""} />
      </div>

      {!editable && caption ? <figcaption className="bx-figure__caption">{caption}</figcaption> : null}

      {editable && open && (
        <div className="bx-figure__widget" contentEditable={false}>
          <label className="bx-figure__field">
            <span>متن جایگزین (Alt)</span>
            <input value={altDraft} onChange={(e) => setAltDraft(e.target.value)} onBlur={commitAlt} placeholder="توضیح کوتاه تصویر برای سئو" />
          </label>

          {inGrid ? (
            <div className="bx-figure__field">
              <span>نحوه نمایش در قاب</span>
              <div className="bx-figure__group">
                {FIT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.value} type="button" title={opt.label} className={fit === opt.value ? "active" : ""} onClick={() => updateAttributes({ fit: opt.value })}>
                      <Icon size={13} />
                      {opt.value === "cover" ? "پر کردن قاب" : "کامل، بدون برش"}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="bx-figure__field">
                <span>اندازه</span>
                <div className="bx-figure__group">
                  {SIZE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" className={size === opt.value ? "active" : ""} onClick={() => updateAttributes({ size: opt.value })}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {size !== "large" && (
                <div className="bx-figure__field">
                  <span>چینش</span>
                  <div className="bx-figure__group">
                    {ALIGN_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button key={opt.value} type="button" title={opt.label} className={align === opt.value ? "active" : ""} onClick={() => updateAttributes({ align: opt.value })}>
                          <Icon size={13} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <label className="bx-figure__field">
                <span>توضیح زیر تصویر</span>
                {captionOpen ? (
                  <input value={captionDraft} onChange={(e) => setCaptionDraft(e.target.value)} onBlur={commitCaption} placeholder="اختیاری…" />
                ) : (
                  <button type="button" className="bx-figure__add-caption-btn" onClick={() => setCaptionOpen(true)}>
                    + افزودن توضیح
                  </button>
                )}
              </label>
            </>
          )}

          <button type="button" className="bx-figure__delete-btn" onClick={handleDelete}>
            {inGrid ? "پاک کردن این اسلات" : "حذف تصویر"}
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
