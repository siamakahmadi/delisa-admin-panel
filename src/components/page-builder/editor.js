"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageBuilderStore } from "@/lib/page-builder/store";
import { uuidv4, adaptPageFromAPI, adaptLayoutToAPI, normalizeSection } from "@/lib/page-builder/normalize";
import { buildDefaultPropsFromFields, buildTypeDefIndex, defaultVisibility } from "@/lib/page-builder/field-utils";
import * as pb from "@/lib/page-builder/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Topbar } from "./topbar";
import { Canvas } from "./canvas";
import { Sidebar } from "./sidebar";
import { LivePreviewPanel } from "./live-preview-panel";
import { VersionHistoryPanel } from "./version-history-panel";
import { SaveTemplateModal } from "./save-template-modal";
import { ValidationModal } from "./validation-modal";
import { SeoModal } from "./seo-modal";
import { DeviceLayoutPanel } from "./device-layout-panel";

export function PageBuilderEditor({ pageId }) {
  const router = useRouter();
  const toast = useToast();

  const setPage = usePageBuilderStore((s) => s.setPage);
  const page = usePageBuilderStore((s) => s.page);
  const history = usePageBuilderStore((s) => s.history);
  const addSectionLocally = usePageBuilderStore((s) => s.addSectionLocally);
  const removeSectionLocally = usePageBuilderStore((s) => s.removeSectionLocally);
  const duplicateSectionLocally = usePageBuilderStore((s) => s.duplicateSectionLocally);
  const reorderSectionsLocally = usePageBuilderStore((s) => s.reorderSectionsLocally);
  const reorderComponentsLocally = usePageBuilderStore((s) => s.reorderComponentsLocally);
  const addComponentLocally = usePageBuilderStore((s) => s.addComponentLocally);
  const removeComponentLocally = usePageBuilderStore((s) => s.removeComponentLocally);
  const updateSectionLocally = usePageBuilderStore((s) => s.updateSectionLocally);
  const setSeo = usePageBuilderStore((s) => s.setSeo);
  const selectSection = usePageBuilderStore((s) => s.selectSection);
  const selectComponent = usePageBuilderStore((s) => s.selectComponent);
  const syncSelectionWithPage = usePageBuilderStore((s) => s.syncSelectionWithPage);
  const commitHistory = usePageBuilderStore((s) => s.commitHistory);
  const undo = usePageBuilderStore((s) => s.undo);
  const redo = usePageBuilderStore((s) => s.redo);

  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const [registry, setRegistry] = useState([]);
  const queryClient = useQueryClient();
  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ["cms-section-templates"],
    queryFn: () => pb.fetchSectionTemplates(),
  });
  const templates = templatesData ?? [];

  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [templateModal, setTemplateModal] = useState(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoSaving, setSeoSaving] = useState(false);
  const [deviceLayoutOpen, setDeviceLayoutOpen] = useState(false);

  const registryByType = useMemo(() => buildTypeDefIndex(registry), [registry]);

  useEffect(() => {
    if (!pageId) return;
    (async () => {
      setLoading(true);
      try {
        const [pageData, types] = await Promise.all([pb.fetchPageAdmin(pageId), pb.fetchComponentTypes().catch(() => [])]);
        setPage(adaptPageFromAPI(pageData));
        setRegistry(types);
      } catch (e) {
        toast.error("خطا در دریافت صفحه", e?.response?.data?.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  useEffect(() => {
    syncSelectionWithPage();
  }, [page, syncSelectionWithPage]);

  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  async function handleAddSection() {
    if (!page) return;
    const tempId = uuidv4();
    const section = {
      id: tempId,
      title: "سکشن جدید",
      order: (page.sections || []).length,
      layout: { display: "block", gridTemplateColumns: "1fr", gap: "12px", padding: "16px", margin: "", className: "" },
      isVisible: true,
      visibility: defaultVisibility(),
      components: [],
    };
    addSectionLocally(section);
    selectSection(tempId);
    try {
      const res = await pb.addSection(page.id, { id: tempId, title: section.title, layout: adaptLayoutToAPI(section.layout), isVisible: true, visibility: section.visibility, components: [] });
      const realId = (res.section || res)._id || (res.section || res).id;
      if (realId) updateSectionLocally(tempId, { id: realId });
      commitHistory();
    } catch (e) {
      removeSectionLocally(tempId);
      toast.error("افزودن سکشن ناموفق بود", e?.response?.data?.message);
    }
  }

  async function handleDeleteSection(sectionId) {
    removeSectionLocally(sectionId);
    try {
      await pb.deleteSection(page.id, sectionId);
      commitHistory();
    } catch {
      toast.error("حذف سکشن ناموفق بود");
    }
  }

  async function handleDuplicateSection(sectionId) {
    try {
      const res = await pb.duplicateSection(page.id, sectionId);
      const fresh = res.section || res;
      duplicateSectionLocally(sectionId, normalizeSection(fresh));
      commitHistory();
    } catch (e) {
      toast.error("تکثیر سکشن ناموفق بود", e?.response?.data?.message);
    }
  }

  async function handleReorderSections(orderedIds) {
    reorderSectionsLocally(orderedIds);
    commitHistory();
    try {
      await pb.reorderSections(page.id, orderedIds.map((id, idx) => ({ id, order: idx })));
    } catch {
      toast.error("ذخیره ترتیب سکشن‌ها ناموفق بود");
    }
  }

  async function handleReorderComponents(sectionId, orderedIds) {
    reorderComponentsLocally(sectionId, orderedIds);
    commitHistory();
    const sec = usePageBuilderStore.getState().page?.sections?.find((s) => s.id === sectionId);
    if (!sec) return;
    try {
      await pb.updateSection(page.id, sectionId, {
        components: (sec.components || []).map((c) => ({ id: c.id, type: c.type, props: c.props, isVisible: c.isVisible, visibility: c.visibility })),
      });
    } catch {
      toast.error("ذخیره ترتیب کامپوننت‌ها ناموفق بود");
    }
  }

  function openSaveTemplateModal(section) {
    setTemplateError(null);
    setTemplateModal(section);
  }

  async function handleSaveTemplate({ name, description }) {
    if (!templateModal) return;
    setTemplateSaving(true);
    setTemplateError(null);
    try {
      const payload = {
        name,
        description,
        section: {
          title: templateModal.title,
          layout: adaptLayoutToAPI(templateModal.layout || {}),
          components: (templateModal.components || []).map((c) => ({ type: c.type, props: c.props, isVisible: c.isVisible, visibility: c.visibility })),
        },
      };
      const res = await pb.createSectionTemplate(payload);
      queryClient.setQueryData(["cms-section-templates"], (prev) => [res.template || res, ...(prev ?? [])]);
      toast.success("بخش در کتابخانه ذخیره شد");
      setTemplateModal(null);
    } catch (e) {
      setTemplateError(e?.response?.data?.message || "خطا در ذخیره بخش");
    } finally {
      setTemplateSaving(false);
    }
  }

  async function handleInsertTemplate(tpl) {
    if (!page) return;
    try {
      const res = await pb.instantiateSectionTemplate(tpl._id);
      const addRes = await pb.addSection(page.id, res.section || res);
      const added = normalizeSection(addRes.section || addRes);
      addSectionLocally(added);
      selectSection(added.id);
      commitHistory();
      toast.success("بخش از کتابخانه اضافه شد");
    } catch (e) {
      toast.error("درج بخش از کتابخانه ناموفق بود", e?.response?.data?.message);
    }
  }

  async function handleAddComponent(sectionId, type) {
    const typeDef = registryByType.get(type);
    const defaultProps = typeDef?.defaultProps || buildDefaultPropsFromFields(typeDef?.fields);
    const comp = { id: uuidv4(), type, props: defaultProps, isVisible: true, visibility: defaultVisibility() };
    addComponentLocally(sectionId, comp);
    selectComponent(comp.id);
    if (!page?.id) return;
    try {
      const res = await pb.addComponent(page.id, sectionId, comp);
      const realObj = res.slot || res.component || res;
      const realId = realObj?._id || realObj?.id;
      if (realId) usePageBuilderStore.getState().updateComponentLocally(sectionId, comp.id, { id: realId });
      commitHistory();
    } catch (e) {
      removeComponentLocally(sectionId, comp.id);
      toast.error("افزودن کامپوننت ناموفق بود", e?.response?.data?.message);
    }
  }

  function handleInsertFromPalette(typeDef) {
    const targetSectionId = usePageBuilderStore.getState().ui.selectedSectionId || page?.sections?.[0]?.id;
    if (!targetSectionId) {
      toast.error("ابتدا یک سکشن اضافه کنید");
      return;
    }
    selectSection(targetSectionId);
    handleAddComponent(targetSectionId, typeDef.type);
  }

  async function handleDeleteComponent(comp) {
    const sectionId = usePageBuilderStore.getState().ui.selectedSectionId;
    if (!page?.id || !sectionId) return;
    removeComponentLocally(sectionId, comp.id);
    try {
      await pb.deleteComponent(page.id, sectionId, comp.id);
      commitHistory();
    } catch {
      toast.error("حذف کامپوننت ناموفق بود");
    }
  }

  function collectValidationIssues() {
    const issues = [];
    for (const sec of page?.sections || []) {
      for (const comp of sec.components || []) {
        const typeDef = registryByType.get(comp.type);
        for (const f of typeDef?.fields || []) {
          if (!f.required) continue;
          const val = comp.props?.[f.key];
          const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
          if (isEmpty) {
            issues.push({ sectionId: sec.id, componentId: comp.id, fieldKey: f.key, sectionTitle: sec.title || "سکشن", componentLabel: typeDef?.label || comp.type, fieldLabel: f.label });
          }
        }
      }
    }
    return issues;
  }

  function jumpToIssue(issue) {
    selectSection(issue.sectionId);
    selectComponent(issue.componentId);
    setTimeout(() => {
      document.querySelector(`[data-field-key="${issue.fieldKey}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }

  async function doPublish() {
    setBusy(true);
    try {
      await pb.publishPage(page.id);
      toast.success("صفحه منتشر شد");
      setPage(adaptPageFromAPI(await pb.fetchPageAdmin(page.id)));
    } catch (e) {
      toast.error("خطا در انتشار", e?.response?.data?.message);
    } finally {
      setBusy(false);
    }
  }

  function askPublish() {
    const issues = collectValidationIssues();
    if (issues.length) {
      setValidationIssues(issues);
      setValidationOpen(true);
      return;
    }
    setConfirm({ title: "انتشار صفحه", message: "صفحه برای همه قابل مشاهده خواهد شد. ادامه می‌دهید؟", confirmLabel: "انتشار", danger: false, action: "publish" });
  }

  function askUnpublish() {
    setConfirm({ title: "لغو انتشار", message: "صفحه از سایت حذف می‌شود اما داده‌ها حفظ می‌شوند.", confirmLabel: "لغو انتشار", danger: false, action: "unpublish" });
  }

  function askDeletePage() {
    setConfirm({ title: "حذف صفحه", message: "این عملیات قابل بازگشت نیست. مطمئنید؟", confirmLabel: "حذف", danger: true, action: "delete" });
  }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === "delete") {
        await pb.deletePage(page.id);
        toast.success("صفحه حذف شد");
        router.push("/content/page-builder");
        return;
      }
      if (confirm.action === "publish") await doPublish();
      if (confirm.action === "unpublish") {
        await pb.unpublishPage(page.id);
        toast.success("انتشار لغو شد");
        setPage(adaptPageFromAPI(await pb.fetchPageAdmin(page.id)));
      }
      setConfirm(null);
    } catch (e) {
      toast.error("خطا", e?.response?.data?.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveSeo(nextSeo) {
    if (!page?.id) return;
    setSeoSaving(true);
    try {
      await pb.updatePage(page.id, { seo: nextSeo });
      setSeo(nextSeo);
      toast.success("سئو و متادیتای صفحه ذخیره شد");
      setSeoOpen(false);
    } catch (e) {
      toast.error("ذخیره سئو ناموفق بود", e?.response?.data?.message);
    } finally {
      setSeoSaving(false);
    }
  }

  const invalidComponentIds = validationOpen ? [] : validationIssues.map((i) => i.componentId);
  const invalidFieldKeysByComponent = useMemo(() => {
    const map = {};
    for (const issue of validationIssues) {
      if (!map[issue.componentId]) map[issue.componentId] = [];
      map[issue.componentId].push(issue.fieldKey);
    }
    return map;
  }, [validationIssues]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!page) return <p className="p-6 text-sm text-[var(--text-muted)]">صفحه یافت نشد</p>;

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col md:-m-6">
      <Topbar
        onPreview={() => setPreviewOpen(true)}
        onPublish={askPublish}
        onUnpublish={askUnpublish}
        onDelete={askDeletePage}
        onHistory={() => setHistoryOpen(true)}
        onSeoSettings={() => setSeoOpen(true)}
        onDeviceLayout={() => setDeviceLayoutOpen(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
      />

      <div className="flex flex-1 overflow-hidden">
        <Canvas
          onAddSection={handleAddSection}
          onReorderSections={handleReorderSections}
          onReorderComponents={handleReorderComponents}
          onDuplicateSection={handleDuplicateSection}
          onDeleteSection={handleDeleteSection}
          onSaveAsTemplate={openSaveTemplateModal}
          registry={registry}
          invalidComponentIds={invalidComponentIds}
        />
        <Sidebar
          page={page}
          registry={registry}
          templates={templates}
          loadingTemplates={loadingTemplates}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onAddComponent={handleAddComponent}
          onDeleteComponent={handleDeleteComponent}
          onInsertFromPalette={handleInsertFromPalette}
          onInsertTemplate={handleInsertTemplate}
          invalidFieldKeysByComponent={invalidFieldKeysByComponent}
        />
      </div>

      <LivePreviewPanel open={previewOpen} onOpenChange={setPreviewOpen} pageId={page?.id} />
      <VersionHistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        pageId={page?.id}
        onRestored={(updatedPage) => {
          setPage(adaptPageFromAPI(updatedPage));
          toast.success("نسخه به‌عنوان پیش‌نویس بازگردانی شد");
        }}
      />
      <SaveTemplateModal open={!!templateModal} onOpenChange={(open) => !open && setTemplateModal(null)} onSave={handleSaveTemplate} saving={templateSaving} error={templateError} />
      <ValidationModal open={validationOpen} onOpenChange={setValidationOpen} issues={validationIssues} onJumpTo={jumpToIssue} />
      <SeoModal open={seoOpen} onOpenChange={setSeoOpen} seo={page?.seo} onSave={handleSaveSeo} saving={seoSaving} />
      <DeviceLayoutPanel open={deviceLayoutOpen} onOpenChange={setDeviceLayoutOpen} page={page} registry={registry} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.danger ? "danger" : "primary"}
        loading={busy}
        onConfirm={runConfirm}
      />
    </div>
  );
}
