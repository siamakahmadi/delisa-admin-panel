"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Undo2, Redo2, Settings2, History, Eye, Rocket, PauseCircle, Save, Trash2, LayoutPanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageBuilderStore } from "@/lib/page-builder/store";
import { schedulePageSave, flushPageSave } from "@/lib/page-builder/autosave";

export function Topbar({ onPreview, onPublish, onUnpublish, onDelete, onHistory, onUndo, onRedo, canUndo, canRedo, onSeoSettings, onDeviceLayout }) {
  const router = useRouter();
  const page = usePageBuilderStore((s) => s.page);
  const setTitle = usePageBuilderStore((s) => s.setTitle);
  const isSaving = usePageBuilderStore((s) => s.ui.isSaving);

  const isPublished = page?.status === "published" || !!page?.publishedAt;
  const isHome = page?.type === "home";
  const isHomeMobile = page?.type === "homeMobile";
  const path = isHome || isHomeMobile ? "/" : `/landing/${page?.slug || ""}`;

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5">
      <button onClick={() => router.push("/content/page-builder")} className="rounded-[var(--radius-md)] p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]">
        <ArrowRight size={17} />
      </button>

      <div className="min-w-0 flex-1">
        <input
          value={page?.title || ""}
          onChange={(e) => {
            setTitle(e.target.value);
            if (page?.id) schedulePageSave(page.id, { title: e.target.value });
          }}
          placeholder="عنوان صفحه"
          className="w-full max-w-xs bg-transparent text-sm font-semibold text-[var(--text)] outline-none"
        />
        <div className="mt-0.5 flex items-center gap-2">
          <Badge variant={isHome || isHomeMobile ? "info" : "brand"} size="sm">
            {isHome ? "صفحه اصلی" : isHomeMobile ? "صفحه اصلی (موبایل)" : "لندینگ"}
          </Badge>
          <code dir="ltr" className="text-[11px] text-[var(--text-faint)]">
            {path}
          </code>
          {isSaving && <span className="text-[11px] text-[var(--text-faint)]">در حال ذخیره…</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} title="واگرد (Ctrl+Z)">
          <Undo2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} title="ازنو (Ctrl+Shift+Z)">
          <Redo2 size={16} />
        </Button>
        <Button variant="outline" size="sm" onClick={onSeoSettings}>
          <Settings2 size={14} />
          سئو
        </Button>
        <Button variant="outline" size="sm" onClick={onDeviceLayout}>
          <LayoutPanelTop size={14} />
          چیدمان دستگاه‌ها
        </Button>
        <Button variant="outline" size="sm" onClick={onHistory}>
          <History size={14} />
          تاریخچه
        </Button>
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye size={14} />
          پیش‌نمایش زنده
        </Button>
        {isPublished ? (
          <Button variant="secondary" size="sm" onClick={onUnpublish}>
            <PauseCircle size={14} />
            لغو انتشار
          </Button>
        ) : (
          <Button size="sm" onClick={onPublish}>
            <Rocket size={14} />
            انتشار
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => page?.id && flushPageSave(page.id)} disabled={!page?.id}>
          <Save size={14} />
          ذخیره
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} title="حذف صفحه">
          <Trash2 size={16} className="text-[var(--danger)]" />
        </Button>
      </div>
    </header>
  );
}
