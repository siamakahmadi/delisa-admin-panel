"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, TrendingDown, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchLoyaltyOverview } from "@/lib/loyalty/api";
import { SectionEnableToggle } from "@/components/homepage/section-enable-toggle";
import { fetchLoyaltySettings, saveLoyaltySettings } from "@/lib/loyalty/api";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1a`, color }}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className="text-lg font-bold text-[var(--text)]">{value.toLocaleString("fa-IR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoyaltyOverviewTab() {
  const { data, isLoading } = useQuery({ queryKey: ["loyalty-overview"], queryFn: fetchLoyaltyOverview });

  return (
    <div>
      <SectionEnableToggle
        queryKey={["loyalty-settings"]}
        fetchFn={fetchLoyaltySettings}
        saveFn={saveLoyaltySettings}
        label="فعال‌سازی باشگاه مشتریان در سایت"
      />

      {isLoading ? (
        <p className="py-6 text-center text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="تعداد اعضا" value={data?.memberCount || 0} color="#a3238e" />
            <StatCard icon={TrendingUp} label="امتیاز صادرشده" value={data?.totalPointsEarned || 0} color="#16a34a" />
            <StatCard icon={TrendingDown} label="امتیاز مصرف‌شده" value={data?.totalPointsRedeemed || 0} color="#dc2626" />
            <StatCard icon={Award} label="موجودی فعلی کل" value={(data?.totalPointsEarned || 0) - (data?.totalPointsRedeemed || 0)} color="#d97706" />
          </div>

          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-bold text-[var(--text)]">برترین اعضا (بر اساس امتیاز کل کسب‌شده)</h3>
              {!data?.topMembers?.length ? (
                <p className="text-sm text-[var(--text-faint)]">هنوز عضوی امتیازی کسب نکرده است.</p>
              ) : (
                <div className="space-y-2">
                  {data.topMembers.map((m, i) => (
                    <div key={m._id} className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-100)] text-xs font-bold text-[var(--brand-700)]">
                          {i + 1}
                        </span>
                        {m.customer?.name || m.customer?.phone || "—"}
                      </span>
                      <span className="font-bold text-[var(--text)]">{m.lifetimePoints.toLocaleString("fa-IR")} امتیاز</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
