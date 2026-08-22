"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { fetchFaqItems, createFaqItem, updateFaqItem, deleteFaqItem } from "@/lib/faq/api";

export default function FaqPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["faq-items"], queryFn: fetchFaqItems });
  const items = data ?? [];
  const active = editing || creating;

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? updateFaqItem(editing._id, payload) : createFaqItem(payload)),
    onSuccess: () => {
      toast.success(editing ? "سوال بروزرسانی شد" : "سوال ایجاد شد");
      queryClient.invalidateQueries({ queryKey: ["faq-items"] });
      setEditing(null);
      setCreating(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ذخیره ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFaqItem(id),
    onSuccess: () => {
      toast.success("حذف شد");
      queryClient.invalidateQueries({ queryKey: ["faq-items"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("حذف ناموفق بود"),
  });

  const columns = [
    { key: "question", header: "سوال", render: (row) => <span className="font-medium">{row.question}</span> },
    { key: "order", header: "ترتیب", render: (row) => row.order ?? 0 },
    {
      key: "showOnHome",
      header: "صفحه اصلی",
      render: (row) => (row.showOnHome ? <Badge variant="info" size="sm" dot>بله</Badge> : <span className="text-xs text-[var(--text-faint)]">—</span>),
    },
    {
      key: "isPublished",
      header: "وضعیت",
      render: (row) =>
        row.isPublished ? (
          <Badge variant="success" size="sm" dot>منتشر شده</Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>پیش‌نویس</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCreating(false); setEditing(row); }}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={15} className="text-[var(--danger)]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="سوالات متداول" subtitle="سوالات صفحه «سوالات متداول» و پیش‌نمایش آن در صفحه اصلی سایت" />

      {!active ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus size={16} />
              افزودن سوال
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            emptyMessage="سوالی یافت نشد"
            onRowClick={(row) => { setCreating(false); setEditing(row); }}
          />
        </>
      ) : (
        <FaqForm
          key={editing?._id ?? "new"}
          editing={editing}
          isPending={saveMutation.isPending}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSubmit={(payload) => saveMutation.mutate(payload)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف سوال"
        description="این سوال برای همیشه حذف می‌شود. آیا مطمئن هستید؟"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function FaqForm({ editing, isPending, onCancel, onSubmit }) {
  const toast = useToast();
  const [question, setQuestion] = useState(editing?.question || "");
  const [answer, setAnswer] = useState({ html: editing?.answerHtml || "" });
  const [order, setOrder] = useState(editing?.order ?? 0);
  const [isPublished, setIsPublished] = useState(editing?.isPublished ?? true);
  const [showOnHome, setShowOnHome] = useState(editing?.showOnHome ?? false);

  const handleSubmit = () => {
    if (!question.trim()) {
      toast.error("سوال الزامی است");
      return;
    }
    if (!answer.html?.trim()) {
      toast.error("پاسخ الزامی است");
      return;
    }
    onSubmit({
      question: question.trim(),
      answerHtml: answer.html,
      order,
      isPublished,
      showOnHome,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "ویرایش سوال" : "سوال جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>سوال</Label>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="مثلاً: محصولات دلیسا اصل هستن؟" />
        </div>

        <div>
          <Label>پاسخ</Label>
          <RichTextEditor value={answer.html} onChange={setAnswer} placeholder="پاسخ را اینجا بنویسید..." />
        </div>

        <div className="max-w-[160px]">
          <Label>ترتیب نمایش</Label>
          <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
          منتشر شود
        </label>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} className="h-4 w-4 accent-[var(--brand-600)]" />
          نمایش در پیش‌نمایش سوالات متداول صفحه اصلی
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>انصراف</Button>
          <Button loading={isPending} onClick={handleSubmit}>
            <Save size={16} />
            {editing ? "ذخیره تغییرات" : "ایجاد"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
