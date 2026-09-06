"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, MessageSquareText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchSmsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate } from "@/lib/crm/api";
import { SMS_PURPOSES, SMS_PURPOSE_LABELS } from "./sms-template-picker";

function TemplateEditor({ open, onOpenChange, template }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!template;
  const [name, setName] = useState(template?.name || "");
  const [bodyId, setBodyId] = useState(template?.bodyId || "");
  const [purpose, setPurpose] = useState(template?.purpose || SMS_PURPOSES[0][0]);
  const [variables, setVariables] = useState((template?.variables || []).join(","));
  const [description, setDescription] = useState(template?.description || "");

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        bodyId,
        purpose,
        description,
        variables: variables.split(",").map((s) => s.trim()).filter(Boolean),
      };
      return isEdit ? updateSmsTemplate(template._id, payload) : createSmsTemplate(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "قالب بروزرسانی شد" : "قالب ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{isEdit ? "ویرایش قالب پیامک" : "ثبت قالب پیامک جدید"}</DialogTitle>
        <DialogDescription>
          شناسه (bodyId) را از پنل ملی‌پیامک، بعد از تایید شدن الگوی متن پیامک، اینجا بچسبانید تا بقیه‌ی بخش‌های سیستم بتوانند آن را انتخاب کنند.
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <div>
            <Label>عنوان قالب (برای خودتان)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً خوش‌آمدگویی مشتری جدید" />
          </div>
          <div>
            <Label>شناسه الگو (bodyId) از پنل ملی‌پیامک</Label>
            <Input value={bodyId} onChange={(e) => setBodyId(e.target.value)} placeholder="مثلاً 123456" dir="ltr" />
          </div>
          <div>
            <Label>این قالب برای کدام بخش است؟</Label>
            <Select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {SMS_PURPOSES.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>ترتیب متغیرهای الگو (با کاما — مثلاً name)</Label>
            <Input value={variables} onChange={(e) => setVariables(e.target.value)} placeholder="name" dir="ltr" />
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              همان ترتیبی که موقع تایید الگو در پنل ملی‌پیامک برای %%1%%، %%2%%... تعریف کردید.
            </p>
          </div>
          <div>
            <Label>یادداشت / متن دقیق الگو (اختیاری)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            />
          </div>

          <Button
            className="w-full"
            disabled={!name.trim() || !bodyId.trim()}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            ذخیره
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SmsTemplatesTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["sms-templates"], queryFn: () => fetchSmsTemplates() });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSmsTemplate(id),
    onSuccess: () => {
      toast.success("قالب حذف شد");
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      setDeleteTarget(null);
    },
  });

  const templates = data ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)]">
        هر قالب پیامکی که در پنل ملی‌پیامک تایید کرده‌اید را یک‌بار اینجا با شناسه‌اش (bodyId) ثبت کنید و مشخص کنید برای کدام بخش (خوش‌آمدگویی، سبد رهاشده، کمپین و ...) است. بعد از آن، هنگام ساخت کمپین یا تنظیم اتوماسیون فقط از بین همین لیست انتخاب می‌کنید.
      </p>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditingTemplate(null);
            setEditorOpen(true);
          }}
        >
          <Plus size={14} />
          قالب جدید
        </Button>
      </div>

      {isLoading && <p className="py-6 text-center text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>}
      {!isLoading && templates.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-faint)]">هنوز قالب پیامکی ثبت نکرده‌اید.</p>
      )}

      {templates.map((t) => (
        <Card key={t._id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-start gap-3">
              <MessageSquareText size={16} className="mt-0.5 shrink-0 text-[var(--brand-500)]" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text)]">{t.name}</h3>
                  <Badge size="sm" variant="brand">
                    {SMS_PURPOSE_LABELS[t.purpose] || t.purpose}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-faint)]" dir="ltr">
                  bodyId: {t.bodyId} {t.variables?.length ? `· vars: ${t.variables.join(", ")}` : ""}
                </p>
                {t.description && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t.description}</p>}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditingTemplate(t);
                  setEditorOpen(true);
                }}
              >
                <Pencil size={14} />
              </Button>
              <Button variant="danger" size="icon" onClick={() => setDeleteTarget(t)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {editorOpen && <TemplateEditor open={editorOpen} onOpenChange={setEditorOpen} template={editingTemplate} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف قالب پیامک"
        description={`قالب «${deleteTarget?.name}» حذف شود؟ کمپین/قوانین اتوماسیونی که قبلاً از آن استفاده کرده‌اند تغییری نمی‌کنند.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
