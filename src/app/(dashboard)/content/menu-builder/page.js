"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Copy, PauseCircle, Trash2, Save, Rocket, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { idOf } from "@/lib/tree-dnd";
import { MenuList } from "@/components/menu-builder/menu-list";
import { MenuTree } from "@/components/menu-builder/tree";
import { ItemEditorPanel } from "@/components/menu-builder/item-editor-panel";
import { MegaMenuPreview } from "@/components/menu-builder/mega-menu-preview";
import { fetchMenus, fetchMenu, createMenu, updateMenu, duplicateMenu, publishMenu, unpublishMenu, deleteMenu, fetchSuggestions } from "@/lib/menu-builder/api";

const LOCATION_OPTIONS = [
  { value: "header", label: "هدر (منوی اصلی)" },
  { value: "footer", label: "فوتر" },
  { value: "blog-header", label: "هدر بلاگ" },
  { value: "blog-footer", label: "فوتر بلاگ" },
  { value: "mobile", label: "منوی موبایل" },
  { value: "account", label: "پنل کاربری" },
  { value: "custom", label: "سفارشی / بدون جایگاه ثابت" },
];

function newTempId() {
  return `tmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function blankItem(parentId, order) {
  return {
    _id: newTempId(),
    title: "",
    resolvedTitle: "",
    resolvedImage: "",
    type: "custom",
    refId: null,
    url: "",
    openInNewTab: false,
    parentItemId: parentId || null,
    order,
    enabled: true,
    icon: "",
    image: "",
    description: "",
    badge: { text: "", color: "" },
    displayStyle: "link",
    menuStyle: "simple",
    columnCount: 4,
    columnSpan: 1,
    visibleOn: ["desktop", "mobile"],
    startsAt: null,
    endsAt: null,
    meta: {},
  };
}

export default function MenuBuilderPage() {
  const toast = useToast();

  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(true);
  const [selectedMenuId, setSelectedMenuId] = useState(null);

  const [menu, setMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [meta, setMeta] = useState({ name: "", slug: "", location: "custom", description: "" });
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [confirmState, setConfirmState] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", location: "custom" });
  const [suggestions, setSuggestions] = useState([]);

  const loadMenus = useCallback(async () => {
    setMenusLoading(true);
    try {
      const list = await fetchMenus();
      setMenus(list);
      return list;
    } catch (e) {
      toast.error("خطا در دریافت منوها", e?.response?.data?.message);
      return [];
    } finally {
      setMenusLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const list = await loadMenus();
      if (list.length) setSelectedMenuId(list[0]._id);
    })();
    (async () => {
      try {
        setSuggestions(await fetchSuggestions());
      } catch {
        // no suggestions available — non-fatal
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!selectedMenuId) {
        setMenu(null);
        setItems([]);
        return;
      }
      setMenuLoading(true);
      try {
        const m = await fetchMenu(selectedMenuId);
        if (!alive) return;
        setMenu(m);
        setMeta({ name: m.name, slug: m.slug, location: m.location || "custom", description: m.description || "" });
        setItems(m.items || []);
        setSelectedItemId(null);
        setDirty(false);
      } catch (e) {
        toast.error("خطا در دریافت منو", e?.response?.data?.message);
      } finally {
        if (alive) setMenuLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenuId]);

  useEffect(() => {
    if (!dirty) return undefined;
    function onBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const selectedItem = useMemo(() => items.find((i) => idOf(i._id) === idOf(selectedItemId)) || null, [items, selectedItemId]);
  const parentOfSelected = useMemo(() => (selectedItem ? items.find((i) => idOf(i._id) === idOf(selectedItem.parentItemId)) : null), [items, selectedItem]);
  const childCountOfSelected = useMemo(() => items.filter((i) => idOf(i.parentItemId) === idOf(selectedItemId)).length, [items, selectedItemId]);

  function markDirty(nextItems) {
    setItems(nextItems);
    setDirty(true);
  }

  function handleAddItem(parentId = null) {
    const siblingCount = items.filter((i) => idOf(i.parentItemId) === idOf(parentId)).length;
    const created = blankItem(parentId, siblingCount);
    markDirty([...items, created]);
    setSelectedItemId(created._id);
  }

  function handlePatchItem(id, fields) {
    markDirty(items.map((i) => (idOf(i._id) === idOf(id) ? { ...i, ...fields } : i)));
  }

  function handleToggleEnabled(id, enabled) {
    handlePatchItem(id, { enabled });
  }

  function collectSubtreeIds(id) {
    const ids = [idOf(id)];
    let frontier = [idOf(id)];
    while (frontier.length) {
      const next = items.filter((i) => frontier.includes(idOf(i.parentItemId))).map((i) => idOf(i._id));
      ids.push(...next);
      frontier = next;
    }
    return new Set(ids);
  }

  function handleDeleteItem(id, descendantCount) {
    const run = () => {
      const toRemove = collectSubtreeIds(id);
      markDirty(items.filter((i) => !toRemove.has(idOf(i._id))));
      if (idOf(selectedItemId) && toRemove.has(idOf(selectedItemId))) setSelectedItemId(null);
      setConfirmState(null);
    };
    if (descendantCount > 0) {
      setConfirmState({
        title: "حذف مورد و زیرمجموعه‌ها",
        message: `این مورد ${descendantCount} زیرمجموعه دارد. با حذف آن، همه زیرمجموعه‌ها نیز حذف می‌شوند. ادامه می‌دهید؟`,
        confirmLabel: "حذف همه",
        danger: true,
        onConfirm: run,
      });
    } else {
      run();
    }
  }

  function handleDuplicateItem(id) {
    const subtreeIds = collectSubtreeIds(id);
    const idMap = new Map();
    subtreeIds.forEach((sid) => idMap.set(sid, newTempId()));
    const original = items.find((i) => idOf(i._id) === idOf(id));
    const siblingCount = items.filter((i) => idOf(i.parentItemId) === idOf(original.parentItemId)).length;

    const clones = items
      .filter((i) => subtreeIds.has(idOf(i._id)))
      .map((i) => ({
        ...i,
        _id: idMap.get(idOf(i._id)),
        parentItemId: idOf(i._id) === idOf(id) ? original.parentItemId : idMap.get(idOf(i.parentItemId)) || null,
        order: idOf(i._id) === idOf(id) ? siblingCount : i.order,
      }));

    markDirty([...items, ...clones]);
    toast.success("مورد تکثیر شد");
  }

  function handleImportChildren(parentId, children) {
    const siblingCount = items.filter((i) => idOf(i.parentItemId) === idOf(parentId)).length;
    const created = children.map((c, idx) =>
      Object.assign(blankItem(parentId, siblingCount + idx), {
        type: "category",
        refId: c._id,
        title: "",
        resolvedTitle: c.title || "",
        resolvedImage: c.image || "",
        image: c.image || "",
      })
    );
    markDirty([...items, ...created]);
  }

  async function handleSave() {
    if (!menu) return;
    setSaving(true);
    try {
      const saved = await updateMenu(menu._id, { name: meta.name, slug: meta.slug, location: meta.location, description: meta.description, items });
      setMenu(saved);
      setItems(saved.items || []);
      setDirty(false);
      loadMenus();
      toast.success("تغییرات ذخیره شد");
      return saved;
    } catch (e) {
      toast.error("خطا در ذخیره منو", e?.response?.data?.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(force = false) {
    if (!menu) return;
    setPublishing(true);
    try {
      if (dirty) await handleSave();
      const published = await publishMenu(menu._id, { force });
      setMenu(published);
      loadMenus();
      toast.success("منو منتشر شد");
      setConfirmState(null);
    } catch (e) {
      const body = e?.response?.data;
      if (e?.response?.status === 409 && body?.error === "location_conflict") {
        setConfirmState({
          title: "جایگاه اشغال شده است",
          message: `منوی «${body.conflict?.name}» هم‌اکنون در جایگاه «${meta.location}» منتشر شده است. با انتشار این منو، آن منو از این جایگاه برداشته می‌شود. ادامه می‌دهید؟`,
          confirmLabel: "جایگزینی و انتشار",
          danger: true,
          onConfirm: () => handlePublish(true),
        });
      } else {
        toast.error("خطا در انتشار منو", body?.message);
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!menu) return;
    try {
      const updated = await unpublishMenu(menu._id);
      setMenu(updated);
      loadMenus();
      toast.success("انتشار منو لغو شد");
    } catch (e) {
      toast.error("خطا", e?.response?.data?.message);
    }
  }

  async function handleDuplicateMenu() {
    if (!menu) return;
    try {
      const clone = await duplicateMenu(menu._id);
      await loadMenus();
      setSelectedMenuId(clone._id);
      toast.success("منو تکثیر شد");
    } catch (e) {
      toast.error("خطا در تکثیر منو", e?.response?.data?.message);
    }
  }

  function handleDeleteMenu() {
    if (!menu) return;
    setConfirmState({
      title: "حذف منو",
      message: `منوی «${menu.name}» برای همیشه حذف می‌شود. مطمئن هستید؟`,
      confirmLabel: "حذف منو",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteMenu(menu._id);
          setConfirmState(null);
          setSelectedMenuId(null);
          const list = await loadMenus();
          setSelectedMenuId(list.length ? list[0]._id : null);
          toast.success("منو حذف شد");
        } catch (e) {
          toast.error("خطا در حذف منو", e?.response?.data?.message);
        }
      },
    });
  }

  async function handleCreateMenu(e) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    try {
      const created = await createMenu(createForm);
      setCreateOpen(false);
      setCreateForm({ name: "", location: "custom" });
      await loadMenus();
      setSelectedMenuId(created._id);
      toast.success("منو ساخته شد");
    } catch (e) {
      toast.error("خطا در ساخت منو", e?.response?.data?.message);
    }
  }

  function selectMenuGuarded(id) {
    if (dirty) {
      setConfirmState({
        title: "تغییرات ذخیره‌نشده",
        message: "تغییرات این منو ذخیره نشده‌اند. با تغییر منو، این تغییرات از بین می‌روند. ادامه می‌دهید؟",
        confirmLabel: "بدون ذخیره ادامه بده",
        danger: true,
        onConfirm: () => {
          setConfirmState(null);
          setSelectedMenuId(id);
        },
      });
      return;
    }
    setSelectedMenuId(id);
  }

  function addSuggestion(s) {
    const siblingCount = items.filter((i) => !i.parentItemId).length;
    const created = Object.assign(blankItem(null, siblingCount), {
      type: s.type,
      refId: s._id,
      title: "",
      resolvedTitle: s.title || "",
      resolvedImage: s.image || "",
      image: s.image || "",
    });
    markDirty([...items, created]);
    toast.success("مورد به منو اضافه شد");
  }

  return (
    <div>
      <PageHeader title="منوساز" subtitle="مدیریت منوهای هدر، فوتر، هدر/فوتر بلاگ، موبایل و پنل کاربری" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_380px]">
        <aside className="space-y-3">
          <MenuList menus={menus} selectedId={selectedMenuId} onSelect={selectMenuGuarded} onCreate={() => setCreateOpen(true)} loading={menusLoading} />

          {suggestions.length > 0 && menu && (
            <Card className="p-3">
              <h3 className="mb-1 text-sm font-semibold text-[var(--text)]">پیشنهادها</h3>
              <p className="mb-2 text-xs text-[var(--text-faint)]">برای افزودن سریع به بالاترین سطح منو کلیک کنید</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 12).map((s) => (
                  <button
                    key={`${s.type}_${s._id}`}
                    type="button"
                    onClick={() => addSuggestion(s)}
                    className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:border-[var(--brand-500)] hover:text-[var(--brand-600)]"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </aside>

        <main className="min-w-0 space-y-4">
          {!menu ? (
            <Card className="flex h-64 items-center justify-center p-6 text-sm text-[var(--text-muted)]">{menuLoading ? "در حال بارگذاری…" : "یک منو را از سمت راست انتخاب یا بسازید."}</Card>
          ) : (
            <>
              <Card className="space-y-3 p-4">
                <Input
                  className="text-base font-semibold"
                  value={meta.name}
                  onChange={(e) => {
                    setMeta((m) => ({ ...m, name: e.target.value }));
                    setDirty(true);
                  }}
                  placeholder="نام منو"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Select className="w-48" value={meta.location} onChange={(e) => { setMeta((m) => ({ ...m, location: e.target.value })); setDirty(true); }}>
                    {LOCATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  <code dir="ltr" className="text-xs text-[var(--text-faint)]">/{meta.slug}</code>
                  {menu.isPublished ? (
                    <Badge variant="success" size="sm" dot>منتشرشده</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">پیش‌نویس</Badge>
                  )}
                  {dirty && <Badge variant="warning" size="sm">تغییرات ذخیره‌نشده</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
                  <Button size="sm" variant="outline" onClick={() => handleAddItem(null)}>
                    <Plus size={13} />
                    لینک جدید
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDuplicateMenu}>
                    <Copy size={13} />
                    تکثیر منو
                  </Button>
                  {menu.isPublished && (
                    <Button size="sm" variant="outline" onClick={handleUnpublish}>
                      <PauseCircle size={13} />
                      لغو انتشار
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-[var(--danger)] hover:text-[var(--danger)]" onClick={handleDeleteMenu}>
                    <Trash2 size={13} />
                    حذف منو
                  </Button>
                  <span className="flex-1" />
                  <Button size="sm" variant="secondary" onClick={handleSave} disabled={!dirty || saving}>
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    ذخیره تغییرات
                  </Button>
                  <Button size="sm" onClick={() => handlePublish(false)} disabled={publishing}>
                    {publishing ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
                    ذخیره و انتشار
                  </Button>
                </div>
              </Card>

              {menuLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <MenuTree
                  items={items}
                  selectedId={selectedItemId}
                  onSelect={setSelectedItemId}
                  onChange={markDirty}
                  onToggleEnabled={handleToggleEnabled}
                  onAddChild={handleAddItem}
                  onDuplicate={handleDuplicateItem}
                  onDelete={handleDeleteItem}
                  onDepthExceeded={() => toast.error("عمق تودرتوی مجاز به حداکثر رسیده است")}
                />
              )}

              {selectedItem && <MegaMenuPreview items={items} rootId={selectedItem._id} />}
              {selectedItem && parentOfSelected?.menuStyle === "mega" && <MegaMenuPreview items={items} rootId={parentOfSelected._id} />}
            </>
          )}
        </main>

        <aside className="min-w-0">
          <div className="sticky top-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
            <ItemEditorPanel
              item={selectedItem}
              parentItem={parentOfSelected}
              childCount={childCountOfSelected}
              onPatch={handlePatchItem}
              onImportChildren={handleImportChildren}
              onNotify={(msg, type) => (type === "error" ? toast.error(msg) : toast.success(msg))}
            />
          </div>
        </aside>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>ساخت منوی جدید</DialogTitle>
          <form onSubmit={handleCreateMenu} className="mt-4 space-y-4">
            <div>
              <Label>نام منو</Label>
              <Input autoFocus value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="مثلاً: منوی اصلی هدر" />
            </div>
            <div>
              <Label>جایگاه نمایش</Label>
              <Select value={createForm.location} onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}>
                {LOCATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">ساخت منو</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
        title={confirmState?.title}
        description={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        variant={confirmState?.danger ? "danger" : "primary"}
        loading={confirmLoading}
        onConfirm={async () => {
          if (!confirmState?.onConfirm) return;
          setConfirmLoading(true);
          try {
            await confirmState.onConfirm();
          } finally {
            setConfirmLoading(false);
          }
        }}
      />
    </div>
  );
}
