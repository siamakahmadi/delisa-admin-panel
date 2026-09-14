"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, History, Eye, Save, Rocket, PauseCircle, Archive, ImagePlus, X, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn, slugify } from "@/lib/utils";
import { DateTimeField } from "@/components/page-builder/fields/datetime-field";
import { BlogEditor } from "@/components/blog/editor/blog-editor";
import { CategorySelect } from "@/components/blog/category-select";
import { TagSelect } from "@/components/blog/tag-select";
import { RevisionsPanel } from "@/components/blog/revisions-panel";
import { fetchPost, createPost, updatePost, checkSlug, uploadBlogImage } from "@/lib/blog/api";
import { LiveSeoAnalysis } from "@/components/seo/live-seo-analysis";

const AUTOSAVE_DELAY = 2500;

function toTagOptions(list) {
  return (list || []).map((item) => (typeof item === "string" ? { value: item, label: item } : { value: item._id || item.value, label: item.name || item.label || item.slug }));
}

const STATUS_LABEL = { draft: "پیش‌نویس", published: "منتشر شده", archived: "بایگانی شده", scheduled: "زمان‌بندی شده" };
const SAVE_INDICATOR = { idle: "", dirty: "تغییرات ذخیره‌نشده", saving: "در حال ذخیره…", saved: "ذخیره شد", error: "خطا در ذخیره" };

export function PostEditor({ mode, postId: initialPostId }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = mode === "edit";

  const [postId, setPostId] = useState(isEdit ? initialPostId : null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const slugTouchedRef = useRef(false);
  const [slugCheck, setSlugCheck] = useState({ checking: false, available: null });

  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState(null);
  const [featured, setFeatured] = useState(false);

  const [status, setStatus] = useState("draft");
  const [publishedAt, setPublishedAt] = useState(null);
  const [scheduleMode, setScheduleMode] = useState(false);

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robots, setRobots] = useState("index,follow");
  const [ogImage, setOgImage] = useState("");
  const [ogUploading, setOgUploading] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  const [initialContent, setInitialContent] = useState(null);
  // نسخه‌ی کم‌تکرار (هر ۱٫۵ ثانیه) از HTML محتوا برای تحلیل زنده‌ی سئو — تا
  // هر کلید تایپ‌شده کل ادیتور را دوباره رندر نکند
  const [seoContentHtml, setSeoContentHtml] = useState("");
  const seoContentTimerRef = useRef(null);
  const contentSnapshotRef = useRef({ json: null, html: "", text: "", wordCount: 0, readingTimeMinutes: 0 });
  const editorRef = useRef(null);

  const [saveState, setSaveState] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const hydrateFromPost = useCallback((post, { includeContent = false } = {}) => {
    setTitle(post.title || "");
    setSlug(post.slug || "");
    setExcerpt(post.excerpt || "");
    setCoverUrl(post.coverUrl || "");
    setCoverAlt(post.coverAlt || "");
    setFeatured(!!post.featured);
    setStatus(post.status || "draft");
    setPublishedAt(post.publishedAt || null);
    setTags(toTagOptions(post.tags));
    setCategory(Array.isArray(post.categories) && post.categories[0] ? post.categories[0]._id || post.categories[0] : null);

    const seo = post.seo || {};
    setSeoTitle(seo.title || "");
    setSeoDescription(seo.description || "");
    setSeoKeywords(Array.isArray(seo.keywords) ? seo.keywords.join(", ") : "");
    setCanonicalUrl(seo.canonicalUrl || "");
    setRobots(seo.robots || "index,follow");
    setOgImage(seo.openGraph?.image || seo.twitter?.image || "");

    if (includeContent) {
      setInitialContent(post.content || null);
      contentSnapshotRef.current = { json: post.content || null, html: post.contentHtml || "", text: "", wordCount: post.wordCount || 0, readingTimeMinutes: post.readingTimeMinutes || 1 };
      setSeoContentHtml(post.contentHtml || "");
    }
  }, []);

  useEffect(() => {
    if (!isEdit || !initialPostId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const post = await fetchPost(initialPostId);
        if (cancelled || !post) return;
        hydrateFromPost(post, { includeContent: true });
        setPostId(post._id);
      } catch (err) {
        if (!cancelled) setLoadError(err?.response?.data?.message || "خطا در بارگذاری پست");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, initialPostId, hydrateFromPost]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!slug) {
        setSlugCheck({ checking: false, available: null });
        return;
      }
      setSlugCheck({ checking: true, available: null });
      try {
        const res = await checkSlug(slug, postId || undefined);
        if (!cancelled) setSlugCheck({ checking: false, available: res?.available !== false });
      } catch {
        if (!cancelled) setSlugCheck({ checking: false, available: null });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug, postId]);

  const buildPayload = useCallback(
    ({ publishNow, scheduleAt, asDraft, asArchived } = {}) => {
      const snap = editorRef.current?.getSnapshot() || contentSnapshotRef.current;
      const keywordsArr = seoKeywords.split(",").map((k) => k.trim()).filter(Boolean);

      const payload = {
        title: title.trim(),
        slug: slug || slugify(title),
        excerpt,
        coverUrl,
        coverAlt,
        featured,
        tags: (tags || []).map((t) => t.value),
        categories: category ? [category] : [],
        meta: { description: excerpt },
        content: snap?.json ?? undefined,
        contentHtml: snap?.html ?? undefined,
        contentType: "prosemirror",
        seo: {
          title: seoTitle || undefined,
          description: seoDescription || undefined,
          keywords: keywordsArr,
          canonicalUrl: canonicalUrl || undefined,
          robots: robots || undefined,
          openGraph: { image: ogImage || undefined },
          twitter: { image: ogImage || undefined },
        },
      };

      if (asArchived) payload.status = "archived";
      else if (asDraft) payload.status = "draft";
      else if (publishNow) {
        payload.status = "published";
        payload.publishedAt = new Date().toISOString();
      } else if (scheduleAt) {
        payload.status = "published";
        payload.publishedAt = scheduleAt;
      }

      return payload;
    },
    [title, slug, excerpt, coverUrl, coverAlt, featured, tags, category, seoTitle, seoDescription, seoKeywords, canonicalUrl, robots, ogImage]
  );

  const doSave = useCallback(
    async (opts = {}) => {
      const { auto = false, ...statusOpts } = opts;
      if (!title.trim()) {
        if (!auto) toast.error("عنوان پست الزامی است");
        return null;
      }

      setSaving(true);
      setSaveState("saving");
      try {
        const payload = buildPayload(statusOpts);
        let post;
        if (!postId) {
          post = await createPost(payload);
          if (post?._id) {
            setPostId(post._id);
            router.replace(`/content/blog/${post._id}`);
          }
        } else {
          post = await updatePost(postId, payload);
        }
        // اتوسیو نباید فیلدهای قابل‌ویرایش (تگ، تصویر، خلاصه، ...) را از
        // پاسخ سرور دوباره ست کند — چون ممکن است کاربر در همین فاصله (چه
        // قبل از ارسال درخواست، چه حین رفت‌وبرگشت شبکه) دوباره ویرایششان
        // کرده باشد؛ این کار همان چیزی بود که باعث می‌شد تگ/تصویر تازه‌اضافه‌شده
        // با اتوسیو دوباره ناپدید شود. فقط ذخیره‌ی دستی (انتشار/بایگانی/...)
        // که وضعیت را واقعاً از سرور تغییر می‌دهد نیاز به هیدریت دارد.
        if (post && !auto) hydrateFromPost(post, { includeContent: false });
        setSaveState("saved");
        if (!auto) {
          toast.success(statusOpts.publishNow || statusOpts.scheduleAt ? "پست منتشر شد" : statusOpts.asArchived ? "پست بایگانی شد" : "ذخیره شد");
        }
        return post;
      } catch (err) {
        setSaveState("error");
        if (!auto) toast.error(err?.response?.data?.message || "خطا در ذخیره");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [title, postId, buildPayload, hydrateFromPost, router, toast]
  );

  // doSave (و buildPayload زیرش) هر بار که یک فیلد عوض می‌شود از نو ساخته
  // می‌شود؛ اما markDirty معمولاً بلافاصله بعد از یک setState فراخوانی
  // می‌شود (مثلاً setTags(v); markDirty();) — یعنی همان لحظه هنوز رندر
  // جدید اتفاق نیفتاده و markDirty نسخه‌ی «قدیمی» doSave را می‌بندد که
  // فیلد تازه‌تغییریافته را نمی‌بیند. اگر کاربر کار دیگری هم نکند، همان
  // تایمر قدیمی 2.5 ثانیه بعد با دیتای قدیمی (بدون آخرین تغییر) ذخیره
  // می‌کند. برای رفع این مشکل، همیشه از طریق یک ref که هر رندر آپدیت
  // می‌شود صدا می‌زنیم تا وقتی تایمر شلیک شد، همیشه آخرین doSave را ببیند.
  const doSaveRef = useRef(doSave);
  useEffect(() => {
    doSaveRef.current = doSave;
  }, [doSave]);

  const autosaveTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(autosaveTimerRef.current), []);

  // اتوسیو فقط محتوا رو ذخیره می‌کنه، نه وضعیت انتشار — قبلاً هر اتوسیو
  // همیشه asDraft:true می‌فرستاد (مگر status==="archived")، یعنی چند ثانیه
  // بعد از زدن «انتشار»، اولین ویرایش کوچیک (حتی تایپوی یه کلمه) با اتوسیو
  // خودش status رو خاموش به "draft" برمی‌گردوند و publishedAt رو هم پاک
  // می‌کرد — دقیقاً همون چیزی که باعث می‌شد پست منتشرشده سمت مشتری غیب بشه.
  // با نفرستادن status توی payload اتوسیو، بک‌اند (UPDATABLE_FIELDS) اصلاً
  // بهش دست نمی‌زنه.
  const markDirty = useCallback(() => {
    setSaveState("dirty");
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => doSaveRef.current({ auto: true }), AUTOSAVE_DELAY);
  }, []);

  const onTitleChange = (v) => {
    setTitle(v);
    if (!slugTouchedRef.current) setSlug(slugify(v || ""));
    if (!seoTitle) setSeoTitle(v);
    markDirty();
  };
  const onSlugChange = (v) => {
    slugTouchedRef.current = true;
    setSlug(v);
    markDirty();
  };

  const onEditorChange = useCallback(
    (snapshot) => {
      contentSnapshotRef.current = snapshot;
      markDirty();
      if (!seoContentTimerRef.current) {
        seoContentTimerRef.current = setTimeout(() => {
          seoContentTimerRef.current = null;
          setSeoContentHtml(contentSnapshotRef.current?.html || "");
        }, 1500);
      }
    },
    [markDirty]
  );

  const uploadCover = async (file) => {
    setCoverUploading(true);
    try {
      const res = await uploadBlogImage(file);
      if (res?.url) {
        setCoverUrl(res.url);
        markDirty();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "خطا در آپلود تصویر");
    } finally {
      setCoverUploading(false);
    }
  };

  const uploadOgImage = async (file) => {
    setOgUploading(true);
    try {
      const res = await uploadBlogImage(file);
      if (res?.url) {
        setOgImage(res.url);
        markDirty();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "خطا در آپلود تصویر");
    } finally {
      setOgUploading(false);
    }
  };

  const isScheduled = status === "published" && publishedAt && new Date(publishedAt) > new Date();
  const statusLabel = isScheduled ? STATUS_LABEL.scheduled : STATUS_LABEL[status] || status;
  const statusVariant = isScheduled ? "info" : status === "published" ? "success" : status === "archived" ? "neutral" : "warning";

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (loadError) return <p className="p-6 text-sm text-[var(--danger)]">{loadError}</p>;

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col md:-m-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/content/blog")}>
            <ArrowRight size={14} />
            بازگشت
          </Button>
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", statusPillClass(statusVariant))}>{statusLabel}</span>
          <span className="text-xs text-[var(--text-faint)]">{SAVE_INDICATOR[saveState]}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {postId && (
            <Button variant="ghost" size="sm" onClick={() => setShowRevisions(true)}>
              <History size={14} />
              تاریخچه
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreviewHtml(editorRef.current?.getSnapshot()?.html || contentSnapshotRef.current?.html || "");
              setShowPreview(true);
            }}
          >
            <Eye size={14} />
            پیش‌نمایش
          </Button>
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => doSave({ asDraft: true })}>
            <Save size={14} />
            ذخیره پیش‌نویس
          </Button>
          {status === "published" && !isScheduled ? (
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => doSave({ asDraft: true })}>
              <PauseCircle size={14} />
              برداشتن از انتشار
            </Button>
          ) : (
            <Button size="sm" disabled={saving} onClick={() => (scheduleMode && publishedAt ? doSave({ scheduleAt: publishedAt }) : doSave({ publishNow: true }))}>
              <Rocket size={14} />
              {scheduleMode && publishedAt ? "زمان‌بندی انتشار" : "انتشار"}
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 gap-5 overflow-hidden p-4 md:p-6">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Input className="!h-auto !border-0 !bg-transparent !px-0 !text-2xl !font-bold !shadow-none focus:!ring-0" placeholder="عنوان نوشته…" value={title} onChange={(e) => onTitleChange(e.target.value)} />

          <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--text-faint)]" dir="ltr">
            <span>/blog/</span>
            <input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="نامک"
              dir="ltr"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-faint)]"
            />
            {slugCheck.checking ? (
              <Loader2 size={12} className="animate-spin" />
            ) : slugCheck.available === false ? (
              <span className="text-[var(--danger)]">قبلاً استفاده شده</span>
            ) : slugCheck.available === true ? (
              <Check size={12} className="text-[var(--success)]" />
            ) : null}
          </div>

          <textarea
            className="mb-4 w-full max-w-full resize-none break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            placeholder="خلاصه کوتاه (برای کارت‌ها و سئو استفاده می‌شود)…"
            rows={2}
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              markDirty();
            }}
          />

          <BlogEditor ref={editorRef} content={initialContent} onChange={onEditorChange} />
        </main>

        <aside className="w-80 shrink-0 space-y-4 overflow-y-auto">
          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">انتشار</h3>
              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={scheduleMode}
                  onChange={(e) => {
                    setScheduleMode(e.target.checked);
                    if (!e.target.checked) setPublishedAt(null);
                  }}
                  className="h-4 w-4 accent-[var(--brand-600)]"
                />
                زمان‌بندی انتشار برای آینده
              </label>
              {scheduleMode && <DateTimeField value={publishedAt} onChange={(v) => { setPublishedAt(v || null); markDirty(); }} />}
              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => {
                    setFeatured(e.target.checked);
                    markDirty();
                  }}
                  className="h-4 w-4 accent-[var(--brand-600)]"
                />
                پست ویژه (نمایش در بخش پیشنهادی)
              </label>
              {status !== "archived" && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => doSave({ asArchived: true })}>
                  <Archive size={13} />
                  بایگانی کردن
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">دسته‌بندی و تگ</h3>
              <div>
                <Label>دسته‌بندی</Label>
                <CategorySelect value={category} onChange={(v) => { setCategory(v); markDirty(); }} />
              </div>
              <div>
                <Label>تگ‌ها</Label>
                <TagSelect value={tags} onChange={(v) => { setTags(v); markDirty(); }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">تصویر کاور</h3>
              <CoverImagePicker uploading={coverUploading} value={coverUrl} onChange={(v) => { setCoverUrl(v); markDirty(); }} onUpload={uploadCover} />
              <div>
                <Label>متن جایگزین تصویر (Alt)</Label>
                <Input
                  value={coverAlt}
                  onChange={(e) => { setCoverAlt(e.target.value); markDirty(); }}
                  placeholder="برای سئو و دسترس‌پذیری — توضیح کوتاه تصویر"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <button type="button" className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text)]" onClick={() => setShowSeo((s) => !s)}>
                سئو
                <ChevronDown size={15} className={cn("transition-transform", showSeo && "rotate-180")} />
              </button>
              {showSeo && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>عنوان سئو</Label>
                    <Input value={seoTitle} onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }} />
                  </div>
                  <div>
                    <Label>توضیح متا</Label>
                    <textarea
                      rows={2}
                      value={seoDescription}
                      onChange={(e) => { setSeoDescription(e.target.value); markDirty(); }}
                      className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--brand-500)]"
                    />
                  </div>
                  <div>
                    <Label>کلمات کلیدی (با کاما جدا کنید)</Label>
                    <Input value={seoKeywords} onChange={(e) => { setSeoKeywords(e.target.value); markDirty(); }} />
                  </div>
                  <div>
                    <Label>Canonical URL</Label>
                    <Input dir="ltr" value={canonicalUrl} onChange={(e) => { setCanonicalUrl(e.target.value); markDirty(); }} />
                  </div>
                  <div>
                    <Label>Robots</Label>
                    <Select value={robots} onChange={(e) => { setRobots(e.target.value); markDirty(); }}>
                      <option value="index,follow">index,follow</option>
                      <option value="noindex,follow">noindex,follow</option>
                      <option value="index,nofollow">index,nofollow</option>
                      <option value="noindex,nofollow">noindex,nofollow</option>
                    </Select>
                  </div>
                  <div>
                    <Label>تصویر Open Graph</Label>
                    <CoverImagePicker uploading={ogUploading} value={ogImage} onChange={setOgImage} onUpload={uploadOgImage} compact />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <LiveSeoAnalysis
                entityType="post"
                entityId={postId}
                onApplySuggestion={(sg) => {
                  if (sg.seoTitle) setSeoTitle(sg.seoTitle);
                  if (sg.metaDescription) setSeoDescription(sg.metaDescription);
                  if (sg.keywords?.length) setSeoKeywords(sg.keywords.join(", "));
                  else if (sg.focusKeyword) setSeoKeywords(sg.focusKeyword);
                  if (sg.excerpt && !excerpt) setExcerpt(sg.excerpt);
                  markDirty();
                }}
                payload={{
                  entityType: "post",
                  entityId: postId || null,
                  title,
                  seoTitle,
                  metaDescription: seoDescription,
                  slug,
                  path: `/blog/${encodeURIComponent(slug || "")}`,
                  keywords: seoKeywords.split(",").map((k) => k.trim()).filter(Boolean),
                  contentHtml: seoContentHtml,
                  excerpt,
                  coverImage: coverUrl ? { url: coverUrl, alt: coverAlt } : null,
                  robots,
                  canonical: canonicalUrl,
                  published: status === "published",
                  post: { categories: category ? 1 : 0, tags: tags.length, ogImage },
                }}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      {postId && <RevisionsPanel open={showRevisions} onOpenChange={setShowRevisions} postId={postId} onRestored={(post) => { hydrateFromPost(post, { includeContent: false }); editorRef.current?.setContent(post.content); }} />}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>پیش‌نمایش</DialogTitle>
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={title} className="mb-3 h-48 w-full rounded-[var(--radius-md)] object-cover" />
            )}
            <h1 className="text-xl font-bold text-[var(--text)]">{title || "(بدون عنوان)"}</h1>
            {excerpt && <p className="mt-2 text-sm text-[var(--text-muted)]">{excerpt}</p>}
            <div className="bx-prose mt-4 !p-0" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function statusPillClass(variant) {
  return {
    success: "bg-[var(--success-bg)] text-[var(--success)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
    neutral: "bg-[var(--surface-muted)] text-[var(--text-muted)]",
    info: "bg-[var(--info-bg)] text-[var(--info)]",
  }[variant];
}

function CoverImagePicker({ value, onChange, onUpload, uploading, compact }) {
  const inputRef = useRef(null);
  return (
    <div>
      {value ? (
        <div className={cn("relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]", compact ? "h-20" : "h-32")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              تعویض
            </Button>
            <Button size="sm" variant="danger" onClick={() => onChange("")}>
              <X size={13} />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]",
            compact ? "h-16" : "h-24"
          )}
        >
          <ImagePlus size={18} />
          <span className="text-xs">{uploading ? "در حال آپلود…" : "انتخاب تصویر"}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onUpload(f);
        }}
      />
    </div>
  );
}
