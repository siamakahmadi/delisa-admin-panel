"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAiConversation } from "@/lib/ai/api";
import { formatDateTime, formatNumber } from "@/lib/utils";

export default function AiConversationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["ai-conversation", id],
    queryFn: () => fetchAiConversation(id),
  });

  const conversation = data?.conversation;
  const messages = data?.messages || [];

  return (
    <div>
      <PageHeader
        title="جزئیات مکالمه"
        subtitle={conversation ? `شروع: ${formatDateTime(conversation.startedAt)}` : ""}
        actions={
          <button
            onClick={() => router.push("/ai/conversations")}
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
          >
            <ArrowRight size={14} />
            بازگشت به لیست
          </button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !conversation ? (
        <p className="text-sm text-[var(--text-faint)]">مکالمه یافت نشد.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetaBox label="تعداد پیام" value={formatNumber(conversation.messageCount)} />
            <MetaBox label="محصولات پیشنهادی" value={formatNumber(conversation.productsSuggestedIds?.length || 0)} />
            <MetaBox label="استفاده از وب" value={formatNumber(conversation.webSearchUsedCount || 0)} />
            <MetaBox label="خطاها" value={formatNumber(conversation.errorCount || 0)} />
          </div>

          <Card>
            <CardContent className="space-y-4">
              {messages.map((m) => (
                <div key={m._id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[75%] rounded-[var(--radius-md)] px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-[var(--brand-600)] text-white"
                        : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.productCards?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.productCards.map((c) => (
                          <Badge key={c.slug} variant="brand" size="sm">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="mt-1.5 text-[10px] opacity-60">
                      {formatDateTime(m.createdAt)}
                      {m.model ? ` · ${m.model}` : ""}
                      {m.responseTimeMs ? ` · ${m.responseTimeMs}ms` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetaBox({ label, value }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
      <p className="text-lg font-bold text-[var(--text)]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
