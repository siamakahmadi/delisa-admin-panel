"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { fetchGateways, setGatewayEnabled } from "@/lib/paymentGatewaysApi";

const QUERY_KEY = ["payment-gateways"];

export default function PaymentGatewaysPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: fetchGateways });
  const gateways = data?.gateways || [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => setGatewayEnabled(id, enabled),
    onSuccess: (g) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(g.enabled ? "درگاه فعال شد" : "درگاه غیرفعال شد");
    },
    onError: () => toast.error("تغییر وضعیت ناموفق بود"),
  });

  const enabledCount = gateways.filter((g) => g.enabled).length;

  return (
    <div>
      <PageHeader
        title="درگاه‌های پرداخت"
        subtitle="درگاه خاموش در سبد خرید و مرحله پرداخت (سایت و اپ) نمایش داده نمی‌شود و مشتری نمی‌تواند با آن پرداخت کند"
      />

      {!isLoading && enabledCount === 0 && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning)]">
          هیچ درگاه فعالی وجود ندارد؛ مشتریان نمی‌توانند پرداخت آنلاین انجام دهند.
        </div>
      )}

      <div className="grid max-w-2xl gap-3">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-20 w-full" />)}

        {gateways.map((g) => (
          <Card key={g._id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <CreditCard size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--text)]">{g.title}</span>
                  <Badge variant={g.enabled ? "success" : "neutral"} dot size="sm">
                    {g.enabled ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
                {g.description && (
                  <p className="mt-1 text-xs text-[var(--text-faint)]">{g.description}</p>
                )}
              </div>
              <input
                type="checkbox"
                aria-label={`فعال بودن ${g.title}`}
                checked={g.enabled}
                disabled={toggleMutation.isPending}
                onChange={(e) => toggleMutation.mutate({ id: g._id, enabled: e.target.checked })}
                className="h-5 w-5 accent-[var(--brand-600)]"
              />
            </CardContent>
          </Card>
        ))}

        <p className="text-xs leading-6 text-[var(--text-faint)]">
          غیرفعال‌کردن روی پرداخت‌هایی که همین الان در جریان‌اند اثر ندارد و تأیید آن‌ها انجام می‌شود.
        </p>
      </div>
    </div>
  );
}
