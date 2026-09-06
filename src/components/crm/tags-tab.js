"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { fetchCustomerTags, createCustomerTag, deleteCustomerTag } from "@/lib/crm/api";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

export function TagsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["customer-tags"], queryFn: fetchCustomerTags });
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const createMutation = useMutation({
    mutationFn: () => createCustomerTag({ name, color }),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["customer-tags"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "ساخت تگ ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCustomerTag(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-tags"] }),
  });

  const tags = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-56"
          placeholder="نام تگ جدید"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-6 w-6 rounded-full border-2"
              style={{ background: c, borderColor: color === c ? "var(--text)" : "transparent" }}
            />
          ))}
        </div>
        <Button size="sm" disabled={!name.trim()} loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
          <Plus size={14} />
          افزودن
        </Button>
      </div>

      {isLoading && <p className="text-sm text-[var(--text-faint)]">در حال بارگذاری...</p>}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag._id} className="gap-2 py-1.5" style={{ background: `${tag.color}22`, color: tag.color }}>
            {tag.name}
            <button onClick={() => deleteMutation.mutate(tag._id)}>
              <Trash2 size={12} />
            </button>
          </Badge>
        ))}
        {!isLoading && tags.length === 0 && <p className="text-sm text-[var(--text-faint)]">هنوز تگی ساخته نشده.</p>}
      </div>
    </div>
  );
}
