"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchCustomerTags } from "@/lib/crm/api";

export const FIELD_DEFS = {
  totalOrders: {
    label: "تعداد سفارش موفق",
    type: "number",
    operators: [["gte", "حداقل"], ["lte", "حداکثر"], ["eq", "برابر"]],
  },
  totalSpent: {
    label: "مجموع خرید (تومان)",
    type: "number",
    operators: [["gte", "حداقل"], ["lte", "حداکثر"], ["eq", "برابر"]],
  },
  lastOrderDaysAgo: {
    label: "روزهای گذشته از آخرین خرید",
    type: "number",
    operators: [
      ["gte", "حداقل این تعداد روز گذشته"],
      ["lte", "حداکثر این تعداد روز گذشته"],
      ["never", "هرگز خرید نکرده"],
    ],
  },
  daysSinceRegistration: {
    label: "روزهای گذشته از ثبت‌نام",
    type: "number",
    operators: [["gte", "حداقل"], ["lte", "حداکثر"]],
  },
  lifecycleStage: {
    label: "مرحله چرخه عمر",
    type: "select",
    operators: [["eq", "برابر"]],
    options: [
      ["new", "جدید"],
      ["active", "فعال"],
      ["vip", "VIP"],
      ["at_risk", "در خطر"],
      ["inactive", "غیرفعال"],
    ],
  },
  status: {
    label: "وضعیت حساب",
    type: "select",
    operators: [["eq", "برابر"]],
    options: [
      ["active", "فعال"],
      ["disabled", "غیرفعال"],
    ],
  },
  city: { label: "شهر", type: "text", operators: [["eq", "برابر"]] },
  tags: { label: "تگ", type: "tag", operators: [["in", "شامل"]] },
};

const FIELD_KEYS = Object.keys(FIELD_DEFS);

function ConditionRow({ condition, onChange, onRemove, tags }) {
  const def = FIELD_DEFS[condition.field] || FIELD_DEFS.totalOrders;
  const needsValue = condition.operator !== "never";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
      <Select
        className="w-48"
        value={condition.field}
        onChange={(e) => {
          const nextDef = FIELD_DEFS[e.target.value];
          onChange({ field: e.target.value, operator: nextDef.operators[0][0], value: "" });
        }}
      >
        {FIELD_KEYS.map((k) => (
          <option key={k} value={k}>
            {FIELD_DEFS[k].label}
          </option>
        ))}
      </Select>

      <Select
        className="w-40"
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value })}
      >
        {def.operators.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </Select>

      {needsValue && def.type === "number" && (
        <Input
          type="number"
          className="w-28"
          value={condition.value ?? ""}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
        />
      )}

      {needsValue && def.type === "text" && (
        <Input
          className="w-40"
          value={condition.value ?? ""}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
        />
      )}

      {needsValue && def.type === "select" && (
        <Select
          className="w-40"
          value={condition.value ?? ""}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
        >
          <option value="">انتخاب کنید</option>
          {def.options.map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </Select>
      )}

      {needsValue && def.type === "tag" && (
        <Select
          className="w-40"
          value={condition.value?.[0] ?? ""}
          onChange={(e) => onChange({ ...condition, value: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">انتخاب کنید</option>
          {(tags ?? []).map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </Select>
      )}

      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 size={15} />
      </Button>
    </div>
  );
}

export function ConditionBuilder({ conditions, onChangeConditions }) {
  const { data: tags } = useQuery({ queryKey: ["customer-tags"], queryFn: fetchCustomerTags });

  const addCondition = () => {
    onChangeConditions([...(conditions || []), { field: "totalOrders", operator: "gte", value: "1" }]);
  };

  const updateCondition = (idx, next) => {
    const copy = [...conditions];
    copy[idx] = next;
    onChangeConditions(copy);
  };

  const removeCondition = (idx) => {
    onChangeConditions(conditions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {(conditions || []).map((c, idx) => (
        <ConditionRow
          key={idx}
          condition={c}
          tags={tags}
          onChange={(next) => updateCondition(idx, next)}
          onRemove={() => removeCondition(idx)}
        />
      ))}
      <Button variant="outline" size="sm" onClick={addCondition}>
        <Plus size={14} />
        افزودن شرط
      </Button>
      {(!conditions || conditions.length === 0) && (
        <p className="text-xs text-[var(--text-faint)]">بدون شرط = همه‌ی مشتریان.</p>
      )}
    </div>
  );
}
