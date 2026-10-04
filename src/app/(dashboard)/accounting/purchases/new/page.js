"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PurchaseForm } from "@/components/ledger/purchase-form";

function Inner() {
  const supplier = useSearchParams().get("supplier") || "";
  return <PurchaseForm defaultSupplier={supplier} />;
}

export default function NewPurchasePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
