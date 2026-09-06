"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { ConditionBuilder } from "./condition-builder";
import {
  fetchSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  previewSegmentConditions,
} from "@/lib/crm/api";

function SegmentEditor({ open, onOpenChange, segment }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!segment;
  const [name, setName] = useState(segment?.name || "");
  const [description, setDescription] = useState(segment?.description || "");
  const [conditions, setConditions] = useState(segment?.conditions || []);
  const [previewCount, setPreviewCount] = useState(null);

  const previewMutation = useMutation({
    mutationFn: () => previewSegmentConditions(conditions),
    onSuccess: (data) => setPreviewCount(data.count),
    onError: () => toast.error("پیش‌نمایش ناموفق بود"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      isEdit
        ? updateSegment(segment._id, { name, description, conditions })
        : createSegment({ name, description, conditions }),
    onSuccess: () => {
      toast.success(isEdit ? "سگمنت بروزرسانی شد" : "سگمنت ساخته شد");
      queryClient.invalidateQueries({ queryKey: ["crm-segments"] });
      onOpenChange(false);
    },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{isEdit ? "ویرایش سگمنت" : "سگمنت جدید"}</DialogTitle>
        <DialogDescription>مشتریانی که در همه‌ی شرط‌های زیر صدق می‌کنند عضو این سگمنت هستند.</DialogDescription>

        <div className="mt-4 space-y-3">
          <div>
            <Label>نام سگمنت</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً مشتریان VIP" />
          </div>
          <div>
            <Label>توضیح (اختیاری)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>شرط‌ها</Label>
            <ConditionBuilder conditions={conditions} onChangeConditions={setConditions} />
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-3">
            <Button variant="outline" size="sm" onClick={() => previewMutation.mutate()} loading={previewMutation.isPending}>
              <Eye size={14} />
              پیش‌نمایش تعداد
            </Button>
            {previewCount !== null && (
              <span className="text-sm font-semibold text-[var(--text)]">
                {formatNumber(previewCount)} مشتری منطبق
              </span>
            )}
          </div>

          <Button className="w-full" disabled={!name.trim()} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            ذخیره سگمنت
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SegmentsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["crm-segments"], queryFn: fetchSegments });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSegment(id),
    onSuccess: () => {
      toast.success("سگمنت حذف شد");
      queryClient.invalidateQueries({ queryKey: ["crm-segments"] });
      setDeleteTarget(null);
    },
  });

  const segments = data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditingSegment(null);
            setEditorOpen(true);
          }}
        >
          <Plus size={14} />
          سگمنت جدید
        </Button>
      </div>

      {isLoading && <p className="py-6 text-center text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>}
      {!isLoading && segments.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-faint)]">هنوز سگمنتی نساخته‌اید.</p>
      )}

      {segments.map((seg) => (
        <Card key={seg._id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">{seg.name}</h3>
              {seg.description && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{seg.description}</p>}
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {formatNumber(seg.memberCountCache || 0)} مشتری
                {seg.lastComputedAt && ` · بروزرسانی ${formatDateTime(seg.lastComputedAt)}`}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditingSegment(seg);
                  setEditorOpen(true);
                }}
              >
                <Pencil size={14} />
              </Button>
              <Button variant="danger" size="icon" onClick={() => setDeleteTarget(seg)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {editorOpen && <SegmentEditor open={editorOpen} onOpenChange={setEditorOpen} segment={editingSegment} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف سگمنت"
        description={`سگمنت «${deleteTarget?.name}» حذف شود؟ کمپین‌هایی که به آن وصل بودند دیگر گیرنده نخواهند داشت.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
