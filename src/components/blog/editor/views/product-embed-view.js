"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { X, Loader2, TriangleAlert, ArrowLeft } from "lucide-react";

function formatToman(n) {
  const num = Number(n) || 0;
  return typeof Intl !== "undefined" && Intl.NumberFormat ? new Intl.NumberFormat("fa-IR").format(num) : String(num);
}

export function ProductEmbedView({ node, deleteNode, editor }) {
  const a = node.attrs;
  const editable = editor?.isEditable;

  if (a.loading) {
    return (
      <NodeViewWrapper className="bx-product-embed bx-product-embed--loading" data-type="product-embed" contentEditable={false}>
        <Loader2 size={16} className="animate-spin" />
        <span>در حال بارگذاری محصول...</span>
      </NodeViewWrapper>
    );
  }

  if (a.error) {
    return (
      <NodeViewWrapper className="bx-product-embed bx-product-embed--error" data-type="product-embed" contentEditable={false}>
        <div className="bx-product-embed__error-title">
          <TriangleAlert size={14} /> خطا در دریافت محصول
        </div>
        <div className="bx-product-embed__error-message">{a.errorMessage || "محصول پیدا نشد یا لینک نامعتبر است."}</div>
        {editable && (
          <button type="button" className="bx-product-embed__remove-inline" onClick={() => deleteNode()}>
            حذف بلوک
          </button>
        )}
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="bx-product-embed" data-type="product-embed" contentEditable={false}>
      {editable && (
        <button type="button" className="bx-product-embed__remove" onClick={() => deleteNode()} title="حذف">
          <X size={13} />
        </button>
      )}
      <a href={a.slug ? `/product/${a.slug}` : "#"} target="_blank" rel="noopener noreferrer" className="bx-product-embed__link">
        <div className="bx-product-embed__image-wrap">
          {a.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.image} alt={a.title || "محصول"} className="bx-product-embed__image" />
          ) : (
            <div className="bx-product-embed__image-placeholder" />
          )}
        </div>
        <div className="bx-product-embed__body">
          {a.brandName && <div className="bx-product-embed__brand">{a.brandName}</div>}
          <div className="bx-product-embed__title">{a.title || "نام محصول"}</div>
          <div className="bx-product-embed__price">
            {Number(a.finalPrice) > 0 ? (
              <>
                <span className="bx-product-embed__price-final">{formatToman(a.finalPrice)} تومان</span>
                {Number(a.price) > Number(a.finalPrice) && <span className="bx-product-embed__price-old">{formatToman(a.price)}</span>}
              </>
            ) : Number(a.price) > 0 ? (
              <span className="bx-product-embed__price-final">{formatToman(a.price)} تومان</span>
            ) : (
              <span className="bx-product-embed__price-unknown">قیمت نامشخص</span>
            )}
          </div>
          {a.available === false && <span className="bx-product-embed__unavailable">ناموجود</span>}
          <span className="bx-product-embed__cta">
            مشاهده محصول <ArrowLeft size={11} />
          </span>
        </div>
      </a>
    </NodeViewWrapper>
  );
}
