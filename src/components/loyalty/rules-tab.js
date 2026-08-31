"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { fetchLoyaltyRules, updateLoyaltyRule } from "@/lib/loyalty/api";

export function LoyaltyRulesTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["loyalty-rules"], queryFn: fetchLoyaltyRules });
  const [drafts, setDrafts] = useState({});

  const mutation = useMutation({
    mutationFn: ({ key, payload }) => updateLoyaltyRule(key, payload),
    onSuccess: () => {
      toast.success("قانون بروزرسانی شد");
      queryClient.invalidateQueries({ queryKey: ["loyalty-rules"] });
    },
    onError: () => toast.error("ذخیره ناموفق بود"),
  });

  const getDraft = (rule) => drafts[rule.key] || rule;
  const patchDraft = (key, fields) => setDrafts((d) => ({ ...d, [key]: { ...(d[key] || {}), ...fields } }));

  const save = (rule) => {
    const draft = getDraft(rule);
    mutation.mutate({
      key: rule.key,
      payload: {
        enabled: draft.enabled,
        pointsValue: draft.pointsValue,
        amountPerPoint: draft.amountPerPoint,
        maxAwardsPerDay: draft.maxAwardsPerDay,
        maxAwardsTotal: draft.maxAwardsTotal,
      },
    });
  };

  if (isLoading) return <p className="py-6 text-center text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>;

  const rules = data ?? [];

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)]">
        هر قانون از قبل به یکی از رویدادهای واقعی سایت (خرید موفق، تایید دیدگاه، دعوت دوست، تعامل با فید و ...) متصل است — اینجا فقط روشن/خاموش بودن و مقدار امتیازش را تنظیم می‌کنید.
      </p>
      {rules.length === 0 && (
        <p className="rounded-[var(--radius-md)] bg-[var(--warning-50)] p-3 text-sm text-[var(--warning-700)]">
          قانونی دریافت نشد — اگر این پیام ادامه داشت، مطمئن شوید نسخه‌ی جدید بک‌اند دیپلوی شده است.
        </p>
      )}
      {rules.map((rule) => {
        const draft = getDraft(rule);
        return (
          <Card key={rule.key}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">{rule.label}</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-faint)]">{rule.description}</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => patchDraft(rule.key, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-[var(--brand-600)]"
                  />
                  فعال
                </label>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                {rule.pointsType === "fixed" ? (
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">امتیاز ثابت</label>
                    <Input
                      type="number"
                      className="w-28"
                      value={draft.pointsValue}
                      onChange={(e) => patchDraft(rule.key, { pointsValue: Number(e.target.value) })}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">هر چند تومان = ۱ امتیاز</label>
                    <Input
                      type="number"
                      className="w-32"
                      value={draft.amountPerPoint}
                      onChange={(e) => patchDraft(rule.key, { amountPerPoint: Number(e.target.value) })}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">سقف روزانه (۰=بدون سقف)</label>
                  <Input
                    type="number"
                    className="w-28"
                    value={draft.maxAwardsPerDay}
                    onChange={(e) => patchDraft(rule.key, { maxAwardsPerDay: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">سقف کل (۰=بدون سقف)</label>
                  <Input
                    type="number"
                    className="w-28"
                    value={draft.maxAwardsTotal}
                    onChange={(e) => patchDraft(rule.key, { maxAwardsTotal: Number(e.target.value) })}
                  />
                </div>
                <Button size="sm" onClick={() => save(rule)} loading={mutation.isPending}>
                  <Save size={14} />
                  ذخیره
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
