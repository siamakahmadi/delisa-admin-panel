"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Pencil, ExternalLink } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchSeoPages } from "@/lib/seo/api";
import { ENTITY_LABELS, CUSTOMER_SITE_URL } from "@/lib/seo/constants";
import { ScoreBar } from "./score-ring";
import { PageReportDialog } from "./page-report-dialog";

export function SeoPages({ auditId, initialType = "" }) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 400);
  const [type, setType] = useState(initialType);
  const [grade, setGrade] = useState("");
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(1);
  const [reportId, setReportId] = useState(null);

  // ?type= از نمای کلی می‌آید — الگوی تنظیم state هنگام تغییر prop
  const [seenType, setSeenType] = useState(initialType);
  if (initialType !== seenType) {
    setSeenType(initialType);
    setType(initialType);
    setPage(1);
  }
  // هر تغییر فیلتر، صفحه‌بندی را از اول شروع می‌کند
  const withReset = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["seo-pages", auditId, dq, type, grade, sort, page],
    queryFn: () => fetchSeoPages({ auditId, q: dq || undefined, entityType: type || undefined, grade: grade || undefined, sort, page, limit: 25 }),
    keepPreviousData: true,
  });

  const columns = [
    { key: "score", header: "نمره", render: (r) => <ScoreBar score={r.score} />, sortable: true, sortValue: (r) => r.score },
    {
      key: "label",
      header: "صفحه",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--text)]">{r.label || r.path}</p>
          <p className="truncate text-[11px] text-[var(--text-faint)]" dir="ltr">{r.path}</p>
        </div>
      ),
      cellClassName: "max-w-[320px]",
    },
    { key: "entityType", header: "نوع", render: (r) => <Badge variant="neutral" size="sm">{ENTITY_LABELS[r.entityType] || r.entityType}</Badge> },
    {
      key: "counts",
      header: "مشکلات",
      render: (r) => (
        <div className="flex gap-1.5 text-[11px] tabular-nums">
          <span className="text-[var(--danger)]">{Number(r.counts?.errors || 0).toLocaleString("fa-IR")}</span>
          <span className="text-[var(--text-faint)]">/</span>
          <span className="text-[var(--warning)]">{Number(r.counts?.warnings || 0).toLocaleString("fa-IR")}</span>
          <span className="text-[var(--text-faint)]">/</span>
          <span className="text-[var(--info)]">{Number(r.counts?.notices || 0).toLocaleString("fa-IR")}</span>
        </div>
      ),
    },
    {
      key: "http",
      header: "HTTP",
      render: (r) => (r.crawled ? <Badge variant={r.http?.status === 200 ? "success" : r.http?.status ? "danger" : "warning"} size="sm">{r.http?.status ?? "خطا"}</Badge> : <span className="text-[11px] text-[var(--text-faint)]">—</span>),
    },
    { key: "ms", header: "پاسخ", render: (r) => (r.http?.responseMs != null ? <span className="text-[11px] tabular-nums text-[var(--text-muted)]">{Number(r.http.responseMs).toLocaleString("fa-IR")}ms</span> : "—") },
    { key: "words", header: "کلمات", render: (r) => <span className="text-[11px] tabular-nums text-[var(--text-muted)]">{r.content?.wordCount != null ? Number(r.content.wordCount).toLocaleString("fa-IR") : "—"}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {r.editUrl && (
            <Link href={r.editUrl} className="text-[var(--brand-600)] hover:text-[var(--brand-700)]" title="ویرایش">
              <Pencil size={14} />
            </Link>
          )}
          <a href={`${CUSTOMER_SITE_URL}${r.path}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-faint)] hover:text-[var(--text)]" title="مشاهده در سایت">
            <ExternalLink size={14} />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <Input value={q} onChange={(e) => withReset(setQ)(e.target.value)} placeholder="جستجوی نام یا آدرس…" className="pr-9" />
        </div>
        <div className="w-44">
          <Select value={type} onChange={(e) => withReset(setType)(e.target.value)}>
            <option value="">همه بخش‌ها</option>
            {Object.entries(ENTITY_LABELS).filter(([k]) => k !== "site").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div className="w-32">
          <Select value={grade} onChange={(e) => withReset(setGrade)(e.target.value)}>
            <option value="">همه درجه‌ها</option>
            {["A", "B", "C", "D", "F"].map((g) => <option key={g} value={g}>درجه {g}</option>)}
          </Select>
        </div>
        <div className="w-44">
          <Select value={sort} onChange={(e) => withReset(setSort)(e.target.value)}>
            <option value="score">کمترین نمره</option>
            <option value="-score">بیشترین نمره</option>
            <option value="-counts.errors">بیشترین خطا</option>
            <option value="-http.responseMs">کندترین</option>
            <option value="label">نام</option>
          </Select>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{Number(data?.total || 0).toLocaleString("fa-IR")} صفحه</span>
      </div>

      <DataTable
        columns={columns}
        data={data?.pages || []}
        isLoading={isLoading}
        onRowClick={(r) => setReportId(r._id)}
        emptyMessage="صفحه‌ای یافت نشد"
        pagination={{ page, pageCount: data?.pageCount || 0, onPageChange: setPage }}
      />

      <PageReportDialog reportId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} />
    </div>
  );
}
