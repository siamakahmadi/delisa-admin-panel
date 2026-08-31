"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";

/**
 * سوییچ خاموش/روشن یک سکشن کامل صفحه‌ی اصلی (اسلایدر هیرو، برندها و ...) —
 * مستقل از آیتم‌های خودِ اون سکشن که جای دیگه‌ای مدیریت می‌شن؛ این فقط
 * می‌گه کل سکشن تو سایت مشتری رندر بشه یا نه.
 */
export function SectionEnableToggle({ queryKey, fetchFn, saveFn, label }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey, queryFn: fetchFn });

  const mutation = useMutation({
    mutationFn: (enabled) => saveFn(enabled),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
      toast.success(result?.enabled === false ? "این بخش غیرفعال شد" : "این بخش فعال شد");
    },
    onError: () => toast.error("تغییر وضعیت ناموفق بود"),
  });

  const enabled = data?.enabled !== false;

  return (
    <label className="mb-4 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text)]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={enabled}
        disabled={isLoading || mutation.isPending}
        onChange={(e) => mutation.mutate(e.target.checked)}
        className="h-4 w-4 accent-[var(--brand-600)]"
      />
    </label>
  );
}
