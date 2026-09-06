"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import { fetchAutomationRules, updateAutomationRule, fetchAutomationRuns, fetchSmsTemplates } from "@/lib/crm/api";
import { SmsTemplateField } from "./sms-template-picker";

const CHANNELS = [
  ["in_app", "درون‌برنامه‌ای"],
  ["push", "پوش نوتیفیکیشن"],
  ["sms", "پیامک"],
];

// هر کلید قانون کدام فیلد شرط را در UI نشان می‌دهد
const CONDITION_FIELDS = {
  welcome: [["delayHours", "چند ساعت بعد از ثبت‌نام"]],
  abandoned_cart: [["delayHours", "چند ساعت بعد از رهاشدن سبد"]],
  winback_inactive: [["inactivityDays", "چند روز بدون خرید"]],
  birthday: [],
  post_delivery_followup: [["delayDays", "چند روز بعد از تحویل"]],
};

function RunsDialog({ rule, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["crm-automation-runs", rule?._id],
    queryFn: () => fetchAutomationRuns(rule._id),
    enabled: !!rule,
  });

  return (
    <Dialog open={!!rule} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>تاریخچه اجرای «{rule?.name}»</DialogTitle>
        <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="text-sm text-[var(--text-faint)]">هنوز اجرایی برای این قانون ثبت نشده است.</p>
          )}
          {(data ?? []).map((run) => (
            <div key={run._id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] p-2.5 text-sm">
              <span>{run.customer?.name || run.customer?.phone || "مشتری حذف‌شده"}</span>
              <span className="text-xs text-[var(--text-faint)]">{formatDateTime(run.triggeredAt)}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AutomationTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["crm-automation-rules"], queryFn: fetchAutomationRules });
  const { data: smsTemplates } = useQuery({ queryKey: ["sms-templates"], queryFn: () => fetchSmsTemplates() });
  const [drafts, setDrafts] = useState({});
  const [runsRule, setRunsRule] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateAutomationRule(id, payload),
    onSuccess: () => {
      toast.success("قانون بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["crm-automation-rules"] });
    },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });

  const getDraft = (rule) => drafts[rule._id] || rule;
  const patchDraft = (id, fields) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] || getFromRules(id)), ...fields } }));

  const rules = data ?? [];
  const getFromRules = (id) => rules.find((r) => r._id === id) || {};

  const toggleChannel = (rule, ch) => {
    const draft = getDraft(rule);
    const channels = draft.channels?.includes(ch)
      ? draft.channels.filter((c) => c !== ch)
      : [...(draft.channels || []), ch];
    patchDraft(rule._id, { channels });
  };

  const save = (rule) => {
    const draft = getDraft(rule);
    mutation.mutate({
      id: rule._id,
      payload: {
        enabled: draft.enabled,
        conditions: draft.conditions,
        channels: draft.channels,
        message: draft.message,
      },
    });
  };

  if (isLoading) return <p className="py-6 text-center text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)]">
        هر قانون به‌صورت پیش‌فرض غیرفعال است — پس از بررسی متن و شرایط، آن را روشن کنید. ارسال پیامک هزینه‌ی واقعی دارد.
      </p>

      {rules.map((rule) => {
        const draft = getDraft(rule);
        const conditionFields = CONDITION_FIELDS[rule.key] || [];

        return (
          <Card key={rule._id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">{rule.name}</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-faint)]">{rule.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Button variant="ghost" size="icon" title="تاریخچه اجرا" onClick={() => setRunsRule(rule)}>
                    <History size={15} />
                  </Button>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!draft.enabled}
                      onChange={(e) => patchDraft(rule._id, { enabled: e.target.checked })}
                      className="h-4 w-4 accent-[var(--brand-600)]"
                    />
                    فعال
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                {conditionFields.map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      className="w-28"
                      value={draft.conditions?.[key] ?? ""}
                      onChange={(e) =>
                        patchDraft(rule._id, { conditions: { ...draft.conditions, [key]: Number(e.target.value) } })
                      }
                    />
                  </div>
                ))}
                <div>
                  <Label>حداقل فاصله بین دو ارسال (روز)</Label>
                  <Input
                    type="number"
                    className="w-28"
                    value={draft.conditions?.cooldownDays ?? ""}
                    onChange={(e) =>
                      patchDraft(rule._id, { conditions: { ...draft.conditions, cooldownDays: Number(e.target.value) } })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>کانال‌ها</Label>
                <div className="flex flex-wrap gap-3">
                  {CHANNELS.map(([val, label]) => (
                    <label key={val} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--brand-600)]"
                        checked={draft.channels?.includes(val)}
                        onChange={() => toggleChannel(rule, val)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <Label>عنوان پیام</Label>
                  <Input
                    value={draft.message?.title ?? ""}
                    onChange={(e) => patchDraft(rule._id, { message: { ...draft.message, title: e.target.value } })}
                  />
                </div>
                <div>
                  <Label>متن پیام</Label>
                  <Input
                    value={draft.message?.body ?? ""}
                    onChange={(e) => patchDraft(rule._id, { message: { ...draft.message, body: e.target.value } })}
                  />
                </div>
              </div>

              {draft.channels?.includes("sms") && (
                <SmsTemplateField
                  purpose={rule.key}
                  templates={smsTemplates}
                  smsBodyId={draft.message?.smsBodyId}
                  onSelect={(tpl) =>
                    patchDraft(rule._id, {
                      message: { ...draft.message, smsBodyId: tpl.bodyId, smsVars: tpl.variables },
                    })
                  }
                />
              )}

              <Button size="sm" onClick={() => save(rule)} loading={mutation.isPending}>
                <Save size={14} />
                ذخیره
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <RunsDialog rule={runsRule} onClose={() => setRunsRule(null)} />
    </div>
  );
}
