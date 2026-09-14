"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Save, ExternalLink, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { BlogEditor } from "@/components/blog/editor/blog-editor";
import { fetchInfoPage, updateInfoPage } from "@/lib/info-pages/api";

const CUSTOMER_SITE_URL = (process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL || "https://delisa.shop").replace(/\/+$/, "");

const SAVE_INDICATOR = { idle: "", dirty: "تغییرات ذخیره‌نشده", saving: "در حال ذخیره…", saved: "ذخیره شد", error: "خطا در ذخیره" };

// Same editor as blog posts (slash menu, links, images, tables, product
// embeds…) — only the page-level fields differ: there is no slug/status/
// cover/category; the four pages always exist on the customer site and
// simply fall back to their built-in text while this stays empty.
export function InfoPageEditor({ pageKey }) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(null);

  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [showSeo, setShowSeo] = useState(false);

  const [initialContent, setInitialContent] = useState(null);
  const contentSnapshotRef = useRef({ json: null, html: "" });
  const editorRef = useRef(null);

  const [saveState, setSaveState] = useState("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchInfoPage(pageKey);
        if (cancelled || !data) return;
        setPage(data);
        setTitle(data.title || "");
        setSeoTitle(data.seo?.title || "");
        setSeoDescription(data.seo?.description || "");
        setIsPublished(data.isPublished !== false);
        setInitialContent(data.content || null);
        contentSnapshotRef.current = { json: data.content || null, html: data.contentHtml || "" };
      } catch (err) {
        if (!cancelled) setLoadError(err?.response?.status === 404 ? "صفحه یافت نشد" : err?.response?.data?.message || "خطا در بارگذاری صفحه");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  const markDirty = useCallback(() => setSaveState("dirty"), []);

  const onEditorChange = useCallback(
    (snap) => {
      contentSnapshotRef.current = snap;
      markDirty();
    },
    [markDirty]
  );

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaveState("saving");
    try {
      const snap = editorRef.current?.getSnapshot() || contentSnapshotRef.current;
      const emptyDoc = editorRef.current?.isEmpty?.() ?? !snap?.html;
      const saved = await updateInfoPage(pageKey, {
        title,
        seo: { title: seoTitle, description: seoDescription },
        isPublished,
        content: emptyDoc ? null : snap?.json || null,
        contentHtml: emptyDoc ? "" : snap?.html || "",
      });
      if (saved) setPage(saved);
      setSaveState("saved");
      toast.success("صفحه ذخیره شد");
    } catch (err) {
      setSaveState("error");
      toast.error(err?.response?.data?.message || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--danger)]">{loadError}</p>
        <Link href="/content/info-pages">
          <Button variant="outline" size="sm">
            <ArrowRight size={14} />
            بازگشت به فهرست
          </Button>
        </Link>
      </div>
    );
  }

  const liveUrl = `${CUSTOMER_SITE_URL}${page?.path || ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/content/info-pages">
            <Button variant="ghost" size="sm" title="بازگشت">
              <ArrowRight size={16} />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">{page?.label}</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]" dir="ltr">
              {page?.path}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              saveState === "error" ? "text-[var(--danger)]" : saveState === "saved" ? "text-[var(--success)]" : "text-[var(--text-muted)]"
            )}
          >
            {SAVE_INDICATOR[saveState]}
          </span>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink size={14} />
              مشاهده در سایت
            </Button>
          </a>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            ذخیره
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <Label>عنوان صفحه (H1)</Label>
            <Input
              value={title}
              placeholder={`پیش‌فرض: ${page?.label || ""}`}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => {
                setIsPublished(e.target.checked);
                markDirty();
              }}
              className="h-4 w-4 accent-[var(--brand-600)]"
            />
            نمایش این متن در سایت
            <span className="text-xs text-[var(--text-muted)]">(خاموش = سایت متن پیش‌فرض خودش را نشان می‌دهد)</span>
          </label>

          <button
            type="button"
            onClick={() => setShowSeo((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ChevronDown size={14} className={cn("transition-transform", showSeo && "rotate-180")} />
            تنظیمات سئو
          </button>

          {showSeo && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>عنوان سئو (title)</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div>
                <Label>توضیح متا (description)</Label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    markDirty();
                  }}
                  className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--brand-500)]"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <BlogEditor
            ref={editorRef}
            content={initialContent}
            onChange={onEditorChange}
            placeholder="متن صفحه را اینجا بنویسید… برای لینک به صفحات دیگر، متن را انتخاب کنید و آیکون لینک را بزنید (مثلاً /bandar-ganaveh)."
          />
        </CardContent>
      </Card>
    </div>
  );
}
