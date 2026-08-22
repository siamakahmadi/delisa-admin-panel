"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Info, TriangleAlert, CircleCheck, OctagonAlert, X } from "lucide-react";

export const CALLOUT_VARIANTS = {
  info: { label: "نکته", icon: Info },
  warning: { label: "هشدار", icon: TriangleAlert },
  success: { label: "موفقیت", icon: CircleCheck },
  danger: { label: "مهم", icon: OctagonAlert },
};

export function CalloutView({ node, updateAttributes, deleteNode, editor }) {
  const variant = CALLOUT_VARIANTS[node.attrs.variant] ? node.attrs.variant : "info";
  const meta = CALLOUT_VARIANTS[variant];
  const Icon = meta.icon;
  const editable = editor?.isEditable;

  return (
    <NodeViewWrapper className={`bx-callout bx-callout--${variant}`} data-type="callout">
      {editable && (
        <div className="bx-callout__toolbar" contentEditable={false}>
          {Object.entries(CALLOUT_VARIANTS).map(([key, v]) => {
            const VIcon = v.icon;
            return (
              <button key={key} type="button" className={key === variant ? "active" : ""} onClick={() => updateAttributes({ variant: key })} title={v.label}>
                <VIcon size={13} />
              </button>
            );
          })}
          <button type="button" className="bx-callout__remove" onClick={() => deleteNode()} title="حذف">
            <X size={13} />
          </button>
        </div>
      )}
      <div className="bx-callout__icon" contentEditable={false}>
        <Icon size={17} />
      </div>
      <NodeViewContent className="bx-callout__content" />
    </NodeViewWrapper>
  );
}
