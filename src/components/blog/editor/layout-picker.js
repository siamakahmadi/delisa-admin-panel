"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { LAYOUTS } from "./extensions/image-grid";

// Tiny CSS-grid mockups so the picker shows what each layout looks like
// instead of making the admin guess from a name.
// [colStart, colEnd, rowStart, rowEnd] per slot (1-indexed, inclusive) —
// must mirror the real placement in globals.css / ArticleBody.module.scss
// (.bx-image-grid--<layout> > :nth-child(N)) exactly, slot order = child order.
const LAYOUT_PREVIEWS = {
  "row-2": { cols: 2, rows: 1, cells: [[1, 1, 1, 1], [2, 2, 1, 1]] },
  "row-3": { cols: 3, rows: 1, cells: [[1, 1, 1, 1], [2, 2, 1, 1], [3, 3, 1, 1]] },
  "feature-right": { cols: 2, rows: 2, cells: [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 1, 2]] },
  "feature-left": { cols: 2, rows: 2, cells: [[1, 1, 1, 2], [2, 2, 1, 1], [2, 2, 2, 2]] },
  "feature-top": { cols: 2, rows: 2, cells: [[1, 2, 1, 1], [1, 1, 2, 2], [2, 2, 2, 2]] },
  "feature-bottom": { cols: 2, rows: 2, cells: [[1, 1, 1, 1], [2, 2, 1, 1], [1, 2, 2, 2]] },
};

function LayoutPreview({ layout }) {
  const spec = LAYOUT_PREVIEWS[layout];
  if (!spec) return null;
  return (
    <div
      className="grid h-6 w-9 gap-0.5"
      style={{ gridTemplateColumns: `repeat(${spec.cols}, 1fr)`, gridTemplateRows: `repeat(${spec.rows}, 1fr)` }}
    >
      {spec.cells.map(([colStart, colEnd, rowStart, rowEnd], i) => (
        <span
          key={i}
          className="rounded-[2px] bg-[var(--text-faint)]"
          style={{ gridColumn: `${colStart} / ${colEnd + 1}`, gridRow: `${rowStart} / ${rowEnd + 1}` }}
        />
      ))}
    </div>
  );
}

// Shared "insert an image gallery" control — used by both the blog editor's
// toolbar and the simpler RichTextEditor (product reviews, FAQ, homepage
// intro, beauty content, ...): every Tiptap-based text field in the admin
// gets the same gallery layouts, not just blog posts.
export function ImageGridPicker({ editor, title = "گالری تصویر (چیدمان گرید)" }) {
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((s) => !s)}
        className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)]"
      >
        <LayoutGrid size={14} />
      </button>
      {open && (
        <div className="absolute top-full z-30 mt-1 grid w-56 grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-lg)]">
          {Object.entries(LAYOUTS).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              title={meta.label}
              onClick={() => {
                editor.chain().focus().insertImageGrid(key).run();
                setOpen(false);
              }}
              className="flex flex-col items-center gap-1 rounded-[var(--radius-sm)] p-1.5 text-[10px] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            >
              <LayoutPreview layout={key} />
              <span className="leading-tight">{meta.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
