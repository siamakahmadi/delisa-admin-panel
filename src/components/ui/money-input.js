"use client";

import { forwardRef } from "react";
import { Input } from "./input";
import { parseMoneyInput } from "@/lib/pricing-intelligence/workbook";

/* Number input that shows thousands separators and accepts Persian/Arabic
   digits. `value` is a number or "" and `onChange` receives the same. */
export const MoneyInput = forwardRef(({ value, onChange, ...props }, ref) => (
  <Input
    ref={ref}
    inputMode="numeric"
    dir="ltr"
    className="text-right tabular-nums"
    value={value === "" || value == null ? "" : Number(value).toLocaleString("fa-IR")}
    onChange={(e) => {
      const n = parseMoneyInput(e.target.value);
      onChange(n == null ? "" : n);
    }}
    {...props}
  />
));
MoneyInput.displayName = "MoneyInput";
