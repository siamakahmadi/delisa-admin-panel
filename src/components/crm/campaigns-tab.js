"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Send, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatNumber, formatDateTime } from "@/lib/utils";
import {
  fetchCampaigns,
  createCampaign,
  deleteCampaign,
  previewCampaignRecipients,
  sendCampaign,
  fetchSegments,
  fetchSmsTemplates,
} from "@/lib/crm/api";
import { SmsTemplateField } from "./sms-template-picker";

const STATUS_LABELS = { draft: "پیش‌نویس", sending: "در حال ارسال", sent: "ارسال شد", failed: "ناموفق" };
const STATUS_VARIANT = { draft: "neutral", sending: "warning", sent: "success", failed: "danger" };
const CHANNELS = [
  ["in_app", "درون‌برنامه‌ای"],
  ["push", "پوش نوتیفیکیشن"],
  ["sms", "پیامک"],
];

function CampaignEditor({ open, onOpenChange }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: segments } = useQuery({ queryKey: ["crm-segments"], queryFn: fetchSegments });
  const { data: smsTemplates } = useQuery({ queryKey: ["sms-templates"], queryFn: () => fetchSmsTemplates() });

  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [channels, setChannels] = useState(["in_app"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [smsBodyId, setSmsBodyId] = useState("");
  const [smsVars, setSmsVars] = useState([]);

  const toggleChannel = (ch) =>
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));

  const createMutation = useMutation({
    mutationFn: () =>
      createCampaign({
        name,
        segment: segmentId || null,
        channels,
        message: {
          title,
          body,
          smsBodyId: channels.includes("sms") ? smsBodyId : "",
          smsVars: channels.includes("sms") ? smsVars : [],
        },
      }),
    onSuccess: () => {
      toast.success("کمپین به صورت پیش‌نویس ساخته شد");
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ساخت کمپین ناموفق بود"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>کمپین پیامی جدید</DialogTitle>
        <DialogDescription>کمپین به‌صورت پیش‌نویس ذخیره می‌شود و ارسال آن یک مرحله‌ی جداست.</DialogDescription>

        <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pl-1">
          <div>
            <Label>نام کمپین</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً پیام تبلیغاتی جمعه" />
          </div>

          <div>
            <Label>مخاطب (سگمنت)</Label>
            <Select value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
              <option value="">— انتخاب سگمنت —</option>
              {(segments ?? []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {!segments?.length && (
              <p className="mt-1 text-xs text-[var(--text-faint)]">
                ابتدا از تب «سگمنت‌ها» یک سگمنت بسازید.
              </p>
            )}
          </div>

          <div>
            <Label>کانال‌های ارسال</Label>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map(([val, label]) => (
                <label key={val} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand-600)]"
                    checked={channels.includes(val)}
                    onChange={() => toggleChannel(val)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>عنوان پیام (درون‌برنامه‌ای/پوش)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="می‌توانید از {{name}} استفاده کنید" />
          </div>
          <div>
            <Label>متن پیام</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-100)]"
            />
          </div>

          {channels.includes("sms") && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--warning)]">
                ارسال پیامک روی خط اشتراکی ملی‌پیامک فقط با «الگوی از پیش تاییدشده» ممکن است — متن آزاد بالا برای پیامک استفاده نمی‌شود.
              </p>
              <SmsTemplateField
                purpose="campaign"
                templates={smsTemplates}
                smsBodyId={smsBodyId}
                onSelect={(tpl) => {
                  setSmsBodyId(tpl.bodyId);
                  setSmsVars(tpl.variables);
                }}
              />
            </div>
          )}

          <Button
            className="w-full"
            disabled={!name.trim() || !segmentId || !channels.length}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            ذخیره به‌عنوان پیش‌نویس
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["crm-campaigns"], queryFn: fetchCampaigns });
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sendTarget, setSendTarget] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const previewMutation = useMutation({
    mutationFn: (id) => previewCampaignRecipients(id),
    onSuccess: (data) => setPreviewData(data),
  });

  const sendMutation = useMutation({
    mutationFn: (id) => sendCampaign(id),
    onSuccess: () => {
      toast.success("کمپین ارسال شد");
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      setSendTarget(null);
      setPreviewData(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ارسال ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCampaign(id),
    onSuccess: () => {
      toast.success("کمپین حذف شد");
      queryClient.invalidateQueries({ queryKey: ["crm-campaigns"] });
      setDeleteTarget(null);
    },
  });

  const campaigns = data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditorOpen(true)}>
          <Plus size={14} />
          کمپین جدید
        </Button>
      </div>

      {isLoading && <p className="py-6 text-center text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>}
      {!isLoading && campaigns.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-faint)]">هنوز کمپینی نساخته‌اید.</p>
      )}

      {campaigns.map((c) => (
        <Card key={c._id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text)]">{c.name}</h3>
                <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABELS[c.status]}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-faint)]">
                سگمنت: {c.segment?.name || "—"} · کانال‌ها: {c.channels?.join("، ")}
              </p>
              {c.status === "sent" && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  هدف: {formatNumber(c.stats?.targeted)} · موفق: {formatNumber(c.stats?.sent)} · ناموفق:{" "}
                  {formatNumber(c.stats?.failed)} · {formatDateTime(c.sentAt)}
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
              {c.status === "draft" && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    title="پیش‌نمایش گیرندگان"
                    onClick={() => {
                      setSendTarget(c);
                      previewMutation.mutate(c._id);
                    }}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button variant="danger" size="icon" onClick={() => setDeleteTarget(c)}>
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {editorOpen && <CampaignEditor open={editorOpen} onOpenChange={setEditorOpen} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف کمپین"
        description={`کمپین «${deleteTarget?.name}» حذف شود؟`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />

      <Dialog open={!!sendTarget} onOpenChange={(v) => !v && setSendTarget(null)}>
        <DialogContent>
          <DialogTitle>ارسال کمپین «{sendTarget?.name}»</DialogTitle>
          <DialogDescription>
            {previewMutation.isPending && "در حال محاسبه‌ی تعداد گیرندگان..."}
            {previewData && (
              <>
                این پیام برای <b>{formatNumber(previewData.count)}</b> مشتری ارسال می‌شود
                {sendTarget?.channels?.includes("sms") && " — شامل هزینه‌ی واقعی پیامک."}
              </>
            )}
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSendTarget(null)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              loading={sendMutation.isPending}
              disabled={!previewData || previewData.count === 0}
              onClick={() => sendMutation.mutate(sendTarget._id)}
            >
              <Send size={14} />
              تایید و ارسال
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
