import { ImageOff, Play } from "lucide-react";

/**
 * Lightweight "wireframe with real content" preview for the canvas — NOT the
 * true live preview (that's the iframe panel). Degrades gracefully for
 * unknown/future registry types via the generic fallback.
 */
export function ComponentPreview({ type, typeDef, props = {} }) {
  const t = String(type || "").toLowerCase();

  if (t === "banner" || t === "promobanner") {
    const img = props.image || props.backgroundImage;
    const showTitle = props.showTitle !== false && props.title;
    const showText = t === "banner" ? props.showText !== false && props.subtitle : props.description;
    return (
      <div
        className="flex h-24 items-end overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)] bg-cover bg-center"
        style={img ? { backgroundImage: `url(${img})` } : undefined}
      >
        {!img && <ImageOff size={20} className="m-auto text-[var(--text-faint)]" />}
        {(showTitle || showText) && (
          <div className="w-full bg-gradient-to-t from-black/60 to-transparent p-2 text-white">
            {showTitle && <strong className="block text-xs">{props.title}</strong>}
            {showText && <span className="block text-[11px] opacity-80">{t === "banner" ? props.subtitle : props.description}</span>}
          </div>
        )}
      </div>
    );
  }

  if (t.startsWith("imageslider")) {
    const items = Array.isArray(props.items) ? props.items : Array.isArray(props.slides) ? props.slides : [];
    return (
      <div className="flex gap-1.5 overflow-x-auto">
        {items.length ? (
          items.slice(0, 6).map((it, i) => (
            <div key={i} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)]">
              {it?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt={it.alt || ""} className="h-full w-full object-cover" />
              ) : (
                <ImageOff size={14} className="text-[var(--text-faint)]" />
              )}
            </div>
          ))
        ) : (
          <span className="text-xs text-[var(--text-faint)]">بدون اسلاید</span>
        )}
      </div>
    );
  }

  if (t.startsWith("productcarousel") || t === "productgrid") {
    const limit = props?.source?.filterItems?.length || props?.source?.displayLimit || props?.displayLimit || 4;
    const count = Math.min(Math.max(Number(limit) || 4, 1), 6);
    return (
      <div>
        {props.title && <strong className="mb-1.5 block text-xs text-[var(--text)]">{props.title}</strong>}
        <div className="flex gap-1.5 overflow-x-auto">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-16 w-14 shrink-0 space-y-1 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-1.5">
              <div className="h-8 w-full rounded-[3px] bg-[var(--border)]" />
              <div className="h-1.5 w-full rounded-full bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (t === "categorygrid" || t === "brandgrid") {
    const count = Math.min(Math.max(props?.source?.filterItems?.length || 4, 2), 8);
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="aspect-square rounded-[var(--radius-sm)] bg-[var(--surface-muted)]" />
        ))}
      </div>
    );
  }

  if (t === "cta") {
    return (
      <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2.5">
        <strong className="text-xs text-[var(--text)]">{props.title || "عنوان فراخوان"}</strong>
        <span className="rounded-full bg-[var(--brand-600)] px-2.5 py-1 text-[11px] text-white">{props.label || props.ctaTitle || "دکمه"}</span>
      </div>
    );
  }

  if (t === "countdown") {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2.5 text-xs">
        <span>⏱ شمارش معکوس</span>
        <code dir="ltr" className="text-[var(--text-faint)]">
          {props.endsAt || props.deadline || "—"}
        </code>
      </div>
    );
  }

  if (t === "richtext") {
    const html = props.html || props.content || "";
    return (
      <div
        className="rte-content max-h-24 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2 text-xs"
        dangerouslySetInnerHTML={{ __html: html || "<p>متن غنی خالی است</p>" }}
      />
    );
  }

  if (t === "navigationlinks") {
    const links = props.links || props.items || [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {(links.length ? links : [{ label: "لینک ۱" }, { label: "لینک ۲" }]).map((l, i) => (
          <span key={i} className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
            {l.label || l.title || `لینک ${i + 1}`}
          </span>
        ))}
      </div>
    );
  }

  if (t === "videoembed") {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2.5 text-xs">
        <Play size={14} className="text-[var(--text-faint)]" />
        <code dir="ltr" className="truncate text-[var(--text-faint)]">
          {props.url || props.src || "بدون لینک ویدیو"}
        </code>
      </div>
    );
  }

  if (t === "spacer") {
    return <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-2 text-center text-[11px] text-[var(--text-faint)]">فاصله‌گذار — {props.height || "40px"}</div>;
  }

  return (
    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-2 text-xs">
      <strong className="block text-[var(--text)]">{typeDef?.label || type}</strong>
      <code dir="ltr" className="block truncate text-[10px] text-[var(--text-faint)]">
        {JSON.stringify(props).slice(0, 80)}
      </code>
    </div>
  );
}
