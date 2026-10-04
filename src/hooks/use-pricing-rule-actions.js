"use client";

import { createElement, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/utils";
import {
  applyPricingRuleNow,
  revertPricingRuleNow,
  previewPricingRule,
} from "@/lib/pricing/pricing-rules-api";

const SYNC_WARNING = "بروزرسانی کاتالوگ نمایشی سایت ناموفق بود — دوباره تلاش کنید";

/* Apply / revert for a saved pricing rule, behind a confirm dialog (these
   touch the real retail price of many products). Render `dialog` once. */
export function usePricingRuleActions() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(null); // { kind: "apply" | "revert", rule }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
    queryClient.invalidateQueries({ queryKey: ["pricing-rule"] });
    queryClient.invalidateQueries({ queryKey: ["pricing-rule-history"] });
  };

  const mutation = useMutation({
    mutationFn: ({ kind, rule }) =>
      kind === "apply" ? applyPricingRuleNow(rule._id) : revertPricingRuleNow(rule._id),
    onSuccess: (res, { kind }) => {
      const verb = kind === "apply" ? "تغییر کرد" : "بازگردانی شد";
      const count = formatNumber(res.affected ?? 0);
      if (res.syncOk === false) {
        toast.error(`قیمت پایه ${count} محصول ${verb} اما ${SYNC_WARNING}`);
      } else if (res.skipped > 0) {
        toast.success(
          `قیمت ${count} محصول ${verb}؛ ${formatNumber(res.skipped)} محصول چون قیمتشان بعد از اعمال دستی تغییر کرده بود دست نخورد`
        );
      } else {
        toast.success(`قیمت ${count} محصول ${verb}`);
      }
      setPending(null);
      refresh();
    },
    onError: (e, { kind }) => {
      toast.error(e?.response?.data?.error || (kind === "apply" ? "اعمال ناموفق بود" : "بازگردانی ناموفق بود"));
      setPending(null);
      refresh();
    },
  });

  // how many products the rule would touch right now, shown in the dialog
  const { data: preview, isFetching } = useQuery({
    queryKey: ["pricing-rule-impact", pending?.rule?._id],
    queryFn: () => previewPricingRule({ id: pending.rule._id }),
    enabled: pending?.kind === "apply",
    staleTime: 0,
    gcTime: 0,
  });

  const isApply = pending?.kind === "apply";
  const description = !pending
    ? ""
    : isApply
      ? `قانون «${pending.rule.name}» قیمت فروش واقعی محصولات را تغییر می‌دهد و فوراً در سایت دیده می‌شود. ${
          isFetching
            ? "در حال محاسبه تعداد محصولات…"
            : `تعداد محصولات تحت تأثیر: ${formatNumber(preview?.matchedCount ?? 0)}.`
        } هر زمان می‌توانید با «بازگردانی» قیمت‌ها را برگردانید.`
      : `قیمت محصولاتی که با قانون «${pending.rule.name}» تغییر کرده‌اند به قیمت قبل از اعمال برمی‌گردد. محصولاتی که بعد از اعمال، دستی قیمتشان عوض شده دست نمی‌خورند.`;

  const dialog = createElement(ConfirmDialog, {
    open: !!pending,
    onOpenChange: (open) => !open && !mutation.isPending && setPending(null),
    title: isApply ? "اعمال قانون روی قیمت‌ها؟" : "بازگردانی قیمت‌ها؟",
    description,
    confirmLabel: isApply ? "اعمال قیمت‌ها" : "بازگردانی",
    variant: isApply ? "primary" : "danger",
    loading: mutation.isPending,
    onConfirm: () => mutation.mutate(pending),
  });

  return {
    dialog,
    askApply: (rule) => setPending({ kind: "apply", rule }),
    askRevert: (rule) => setPending({ kind: "revert", rule }),
    isBusy: (id) => mutation.isPending && mutation.variables?.rule?._id === id,
  };
}
