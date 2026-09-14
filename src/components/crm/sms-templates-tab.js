"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, MessageSquareText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchSmsTemplates, deleteSmsTemplate } from "@/lib/crm/api";
import { SmsTemplateEditor, SMS_PURPOSE_LABELS } from "./sms-template-picker";

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

      {editorOpen && <SmsTemplateEditor open={editorOpen} onOpenChange={setEditorOpen} template={editingTemplate} />}

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
