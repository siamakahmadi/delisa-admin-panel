import { Rocket } from "lucide-react";

export function ComingSoon({ module }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-cyan)] text-white shadow-[var(--shadow-md)]">
        <Rocket size={28} />
      </div>
      <h2 className="text-lg font-bold text-[var(--text)]">{module} به‌زودی</h2>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
        این بخش در فاز بعدی توسعه‌ی پنل مدیریت پیاده‌سازی می‌شود. فعلاً از منوهای فعال برای مدیریت
        فروشگاه استفاده کنید.
      </p>
    </div>
  );
}
