"use client";

// پیش‌نمایش زنده‌ی کارت محصول در پنل ادمین — همان ساختار و همان CSS
// variableهای ProductCard سایت مشتری (--pc-*) را بازسازی می‌کند تا آنچه
// ادمین می‌بیند دقیقاً همان چیزی باشد که روی سایت رندر می‌شود.
import { useMemo } from "react";

const SAMPLE = {
  brand: "لورآل",
  title: "کرم پودر مات ۳۲ ساعته اینفلیبل لورال حاوی ۴٪ نیاسینامید شماره ۱۳۰",
  description: "پوشانندگی بالا، ماندگاری طولانی و بافت سبک مناسب پوست چرب و مختلط.",
  price: "۸۹۰٬۰۰۰",
  originalPrice: "۱٬۱۵۰٬۰۰۰",
  percent: 22,
  image:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8d7e3"/><stop offset="1" stop-color="#ce3263"/></linearGradient></defs><rect x="60" y="20" width="80" height="40" rx="8" fill="#333"/><rect x="40" y="60" width="120" height="180" rx="18" fill="url(#g)"/><rect x="60" y="120" width="80" height="40" rx="6" fill="#fff" opacity=".85"/></svg>'
    ),
};

function ratioCss(ratio) {
  const [w, h] = String(ratio || "1:1").split(":").map(Number);
  return w && h ? `${w} / ${h}` : "1 / 1";
}

function CartIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
      <path
        d="M13.959 9.25V4.75C13.959 2.67893 12.28 1 10.209 1C8.13791 1 6.45898 2.67893 6.45898 4.75V9.25M17.815 7.25723L19.0782 19.2572C19.1481 19.9215 18.6273 20.5 17.9593 20.5H2.45862C1.7907 20.5 1.26988 19.9215 1.3398 19.2572L2.60296 7.25723C2.66323 6.68466 3.14605 6.25 3.72177 6.25H16.6962C17.2719 6.25 17.7547 6.68466 17.815 7.25723Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="11.0835" y="12.75" width="10.5" height="10.5" rx="5.25" fill="currentColor" />
      <path d="M16.3335 15.5v5M13.8335 18h5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * props: settings (شکل کامل Settings.productCard)، device: "desktop"|"mobile"،
 * outOfStock: پیش‌نمایش حالت ناموجود
 */
export default function ProductCardPreview({ settings, device = "desktop", outOfStock = false, width }) {
  const d = settings?.[device] || {};
  const c = settings?.colors || {};
  const el = settings?.elements || {};
  const fit = d.fit === "cover" ? "cover" : "contain";
  const scale = fit === "cover" ? 100 : Number(d.imageScale) || 80;
  const cardWidth = width || (device === "mobile" ? 180 : 268);
  const showDiscount = el.discountBadge !== false && !outOfStock;
  const discountText = String(settings?.discountLabel || "-{percent}%").replace("{percent}", String(SAMPLE.percent));

  const styleVars = useMemo(
    () => ({
      "--pc-ratio": ratioCss(d.ratio),
      "--pc-image-fit": fit,
      "--pc-image-scale": `${scale}%`,
      "--pc-title-size": `${d.titleSize || 14}px`,
      "--pc-brand-size": `${d.brandSize || 12}px`,
      "--pc-price-size": `${d.priceSize || 15}px`,
      "--pc-original-size": `${d.originalPriceSize || 12}px`,
      "--pc-desc-size": `${d.descriptionSize || 12}px`,
      "--pc-badge-size": `${d.badgeSize || 11}px`,
      "--pc-button-size": `${d.buttonSize || 24}px`,
      "--pc-title-lines": d.titleLines || 2,
      "--pc-desc-lines": d.descriptionLines || 2,
      "--pc-padding": `${d.padding ?? 12}px`,
      "--pc-title-weight": settings?.titleWeight || 400,
      "--pc-brand-weight": settings?.brandWeight || 600,
      "--pc-price-weight": settings?.priceWeight || 800,
      "--pc-radius": `${settings?.borderRadius || 0}px`,
      "--pc-bg": c.cardBackground || "#fff",
      "--pc-image-bg": c.imageBackground || "#fff",
      "--pc-border": c.border ? `1px solid ${c.border}` : "none",
      "--pc-title-color": c.title || "#262626",
      "--pc-brand-color": c.brand || "#262626",
      "--pc-desc-color": c.description || "#6b6b6b",
      "--pc-price-color": c.price || "#262626",
      "--pc-original-color": c.originalPrice || "#b0b0b0",
      "--pc-discount-bg": c.discountBackground || "#e23627",
      "--pc-discount-color": c.discountText || "#fff",
      "--pc-oos-bg": c.outOfStockBackground || "rgba(38,38,38,.85)",
      "--pc-oos-color": c.outOfStockText || "#fff",
      "--pc-button-color": c.button || "#0F172A",
      "--pc-button-bg": c.buttonBackground || "transparent",
    }),
    [d, c, settings, fit, scale]
  );

  return (
    <div dir="rtl" style={{ ...styleVars, fontFamily: "Vazirmatn, sans-serif" }}>
      <article
        style={{
          width: cardWidth,
          background: "var(--pc-bg)",
          border: "var(--pc-border)",
          borderRadius: "var(--pc-radius)",
          padding: "var(--pc-padding) calc(var(--pc-padding) + 2px)",
          display: "flex",
          flexDirection: "column",
          gap: device === "mobile" ? 6 : 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "var(--pc-ratio)",
            background: "var(--pc-image-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SAMPLE.image}
            alt=""
            style={{ width: "var(--pc-image-scale)", height: "var(--pc-image-scale)", objectFit: "var(--pc-image-fit)", display: "block" }}
          />
          {showDiscount && (
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                minWidth: 38,
                height: 22,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--pc-discount-bg)",
                color: "var(--pc-discount-color)",
                fontSize: "var(--pc-badge-size)",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {discountText}
            </span>
          )}
          {outOfStock && el.outOfStockBadge !== false && (
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                height: 22,
                padding: "2px 10px",
                borderRadius: 999,
                background: "var(--pc-oos-bg)",
                color: "var(--pc-oos-color)",
                fontSize: "var(--pc-badge-size)",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              ناموجود
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {el.brand !== false && (
            <div
              style={{
                color: "var(--pc-brand-color)",
                fontSize: "var(--pc-brand-size)",
                fontWeight: "var(--pc-brand-weight)",
                lineHeight: 1.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {SAMPLE.brand}
            </div>
          )}
          {el.title !== false && (
            <h3
              style={{
                margin: 0,
                color: "var(--pc-title-color)",
                fontSize: "var(--pc-title-size)",
                fontWeight: "var(--pc-title-weight)",
                lineHeight: 1.45,
                display: "-webkit-box",
                WebkitLineClamp: "var(--pc-title-lines)",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {SAMPLE.title}
            </h3>
          )}
          {el.shortDescription && (
            <p
              style={{
                margin: 0,
                color: "var(--pc-desc-color)",
                fontSize: "var(--pc-desc-size)",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: "var(--pc-desc-lines)",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {SAMPLE.description}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", gap: 8 }}>
            {outOfStock ? (
              el.notifyStock !== false ? (
                <span style={{ fontSize: 11, color: "var(--pc-desc-color)", border: "1px dashed currentColor", borderRadius: 999, padding: "4px 10px" }}>
                  🔔 خبرم کن
                </span>
              ) : (
                <span />
              )
            ) : el.addToCart !== false ? (
              settings?.addToCartStyle === "button" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    fontSize: "var(--pc-desc-size)",
                    fontWeight: 600,
                    color: "var(--pc-button-color)",
                    background: "var(--pc-button-bg)",
                    border: "1px solid var(--pc-button-color)",
                    borderRadius: "calc(var(--pc-radius) + 6px)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <CartIcon size={18} />
                  {settings?.addToCartLabel || "افزودن به سبد"}
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--pc-button-color)",
                    background: "var(--pc-button-bg)",
                    borderRadius: 999,
                    padding: c.buttonBackground ? 6 : 0,
                  }}
                >
                  <CartIcon size={`var(--pc-button-size)`} />
                </span>
              )
            ) : (
              <span />
            )}

            {!outOfStock && el.price !== false && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                {el.originalPrice !== false && (
                  <span style={{ color: "var(--pc-original-color)", fontSize: "var(--pc-original-size)", textDecoration: "line-through", lineHeight: 1.35 }}>
                    {SAMPLE.originalPrice}
                  </span>
                )}
                <span style={{ color: "var(--pc-price-color)", fontSize: "var(--pc-price-size)", fontWeight: "var(--pc-price-weight)", lineHeight: 1.35 }}>
                  {SAMPLE.price} <span style={{ fontSize: "0.7em", fontWeight: 500 }}>تومان</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
