"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

const CONFIG = {
  category: { title: "افزودن سریع دسته‌بندی", endpoint: "/api/admin/categories", queryKey: "categories", nameLabel: "نام دسته‌بندی" },
  brand: { title: "افزودن سریع برند", endpoint: "/api/brands", queryKey: "brands", nameLabel: "نام برند" },
  productType: { title: "افزودن سریع نوع محصول", endpoint: "/api/product-types", queryKey: "product-types", nameLabel: "نام نوع محصول" },
};

export function QuickAddDialog({ type, open, onOpenChange, categories = [], parentId = null, onCreated }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [parent, setParent] = useState(parentId);
  const [error, setError] = useState("");

  const cfg = type ? CONFIG[type] : null;

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), slug: slugify(name) };
      if (type === "category") payload.parent = parent || null;
      return apiClient.post(cfg?.endpoint, payload);
    },
    onSuccess: (res) => {
      toast.success("با موفقیت ایجاد شد");
      queryClient.invalidateQueries({ queryKey: [cfg?.queryKey] });
      onCreated?.(res.data?._id ? res.data : res.data?.data);
      onOpenChange(false);
    },
    onError: (err) => setError(err?.response?.data?.message || err?.response?.data?.error || "ثبت ناموفق بود"),
  });

  if (!type || !cfg) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{cfg.title}</DialogTitle>
        <div className="mt-4 space-y-4">
          <div>
            <Label>{cfg.nameLabel}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          {type === "category" && (
            <div>
              <Label>دسته والد (اختیاری)</Label>
              <Select value={parent || ""} onChange={(e) => setParent(e.target.value || null)}>
                <option value="">دسته اصلی</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <FieldError>{error}</FieldError>
          <Button className="w-full" disabled={!name.trim()} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            ثبت و انتخاب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
