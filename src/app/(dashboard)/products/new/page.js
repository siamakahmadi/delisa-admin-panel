"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  const router = useRouter();
  return (
    <div>
      <PageHeader
        title="افزودن محصول"
        subtitle="اطلاعات محصول جدید را وارد کنید"
        actions={
          <Button variant="outline" onClick={() => router.push("/products")}>
            <ArrowRight size={16} />
            بازگشت
          </Button>
        }
      />
      <ProductForm />
    </div>
  );
}
