"use client";

import { useEffect, useState } from "react";
import { AiAssistDialog } from "./ai-assist-dialog";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const textToHtml = (t) =>
  String(t || "")
    .split(/\n+/)
    .filter(Boolean)
    .map((l) => `<p>${esc(l)}</p>`)
    .join("");

/**
 * نویسنده‌ی هوشمند برای هر ویرایشگر Tiptap: انتخاب فعلی را می‌خواند و خروجی را
 * جایگزین انتخاب / کل متن یا به انتها اضافه می‌کند.
 */
export function EditorAiDialog({ editor, open, onOpenChange, context }) {
  const [sel, setSel] = useState({ from: 0, to: 0, text: "", html: "" });
  const [fullHtml, setFullHtml] = useState("");

  useEffect(() => {
    if (!open || !editor) return;
    const { from, to } = editor.state.selection;
    const text = from !== to ? editor.state.doc.textBetween(from, to, "\n") : "";
    setSel({ from, to, text, html: textToHtml(text) });
    setFullHtml(editor.getHTML());
  }, [open, editor]);

  if (!editor) return null;
  const hasSelection = Boolean(sel.text.trim());

  const onApply = ({ mode, html, text }) => {
    const content = html || textToHtml(text);
    if (!content) return;
    const chain = editor.chain().focus();
    if (mode === "append") {
      chain.insertContentAt(editor.state.doc.content.size, content).run();
    } else if (hasSelection) {
      chain.insertContentAt({ from: sel.from, to: sel.to }, content).run();
    } else {
      chain.setContent(content, { emitUpdate: true }).run();
    }
  };

  return (
    <AiAssistDialog
      open={open}
      onOpenChange={onOpenChange}
      hasSelection={hasSelection}
      selectionText={sel.html}
      fullText={fullHtml}
      context={context}
      onApply={onApply}
    />
  );
}
