"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Plus, X } from "lucide-react";
import { LAYOUTS } from "../extensions/image-grid";

// Every slot uploads its own image (see image-view.js's "+" placeholder) —
// this toolbar only manages the gallery itself: add another slot (flexible
// layouts only; a "feature-*" layout's slot count is fixed by its CSS
// placement, see extensions/image-grid.js) and delete the whole gallery.
export function ImageGridView({ node, deleteNode, editor, getPos }) {
  const editable = !!editor?.isEditable;
  const layout = LAYOUTS[node.attrs.layout] ? node.attrs.layout : "row-2";
  const meta = LAYOUTS[layout];

  const addSlot = () => {
    if (typeof getPos !== "function" || !editor) return;
    const pos = getPos();
    const current = editor.state.doc.nodeAt(pos);
    if (!current) return;
    const endPos = pos + current.nodeSize - 1;
    editor.chain().focus().insertContentAt(endPos, { type: "image", attrs: { src: "", alt: "" } }).run();
  };

  return (
    <NodeViewWrapper className="bx-image-grid-wrap" data-drag-handle>
      {editable && (
        <div className="bx-image-grid__toolbar" contentEditable={false}>
          {!meta.fixed && (
            <button type="button" title="افزودن اسلات" onClick={addSlot}>
              <Plus size={14} />
            </button>
          )}
          <button type="button" className="bx-figure__remove" title="حذف گالری" onClick={() => deleteNode()}>
            <X size={14} />
          </button>
        </div>
      )}

      <NodeViewContent className={`bx-image-grid bx-image-grid--${layout}`} />
    </NodeViewWrapper>
  );
}
