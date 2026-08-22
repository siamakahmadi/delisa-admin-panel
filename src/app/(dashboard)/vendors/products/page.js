"use client";

import { useRouter } from "next/navigation";
import { Package, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default function VendorsProductsPage() {
  const router = useRouter();
  return (
    <div>
      <PageHeader title="محصولات فروشندگان" subtitle="مشاهده‌ی محصولات هر فروشنده" />
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-20 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-teal)] to-[var(--accent-cyan)] text-white shadow-[var(--shadow-md)]">
          <Package size={28} />
        </div>
        <h2 className="text-lg font-bold text-[var(--text)]">لیست محصولات به تفکیک فروشنده است</h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
          برای مشاهده‌ی محصولات هر فروشنده، از لیست فروشندگان وارد پروفایل او شوید و تب «محصولات» را باز کنید.
        </p>
        <Button className="mt-5" onClick={() => router.push("/vendors")}>
          <ArrowLeft size={16} />
          رفتن به لیست فروشندگان
        </Button>
      </div>
    </div>
  );
}
