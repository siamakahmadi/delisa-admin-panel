"use client";

const STOREFRONT = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://delisa.shop";
const URL_SPLIT = /(https?:\/\/[^\s]+)/gi;

function storefrontHref(path) {
  if (!path) return STOREFRONT;
  if (/^https?:\/\//i.test(path)) return path;
  return `${STOREFRONT.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function LinkifiedText({ text, className = "" }) {
  const parts = String(text || "").split(URL_SPLIT);
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, index) =>
        /^https?:\/\//i.test(part) ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
}

export function ProductCardMessage({ meta, compact = false }) {
  if (!meta) return null;
  const href = storefrontHref(meta.url || (meta.slug ? `/product/${meta.slug}` : ""));
  const price = Number(meta.price || 0);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`block overflow-hidden rounded-2xl border border-black/5 bg-white text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        compact ? "w-[220px]" : "w-[260px]"
      }`}
    >
      <div className="aspect-[16/10] overflow-hidden bg-[var(--surface-muted)]">
        {meta.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.image} alt={meta.name || ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-faint)]">بدون تصویر</div>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-6 text-[var(--text)]">{meta.name}</p>
        {price > 0 && (
          <p className="text-sm font-semibold text-[var(--brand-700)]">
            {price.toLocaleString("fa-IR")} تومان
          </p>
        )}
        <span className="inline-flex text-xs text-[var(--brand-600)]">مشاهده محصول</span>
      </div>
    </a>
  );
}

export function ChatMessageBody({ message }) {
  if (message.kind === "product") {
    return <ProductCardMessage meta={message.meta} />;
  }
  if (message.kind === "link") {
    const href = message.meta?.url || message.message;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[260px] rounded-xl bg-white/10 px-3 py-2 text-sm underline underline-offset-2"
      >
        {href}
      </a>
    );
  }
  return <LinkifiedText text={message.message} />;
}
