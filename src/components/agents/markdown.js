"use client";

// رندر ساده‌ی مارک‌داون (تیتر، لیست، جدول، پررنگ، لینک) بدون dangerouslySetInnerHTML.
import { Fragment } from "react";

function inline(text, key) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={`${key}-${i}`}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={`${key}-${i}`} className="rounded bg-[var(--surface-muted)] px-1 text-[0.9em]">{tok.slice(1, -1)}</code>);
    else {
      const label = tok.slice(1, tok.indexOf("]"));
      parts.push(
        <a key={`${key}-${i}`} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-600)] underline">
          {label}
        </a>
      );
    }
    last = m.index + tok.length;
    i += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function Markdown({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls = level <= 2 ? "mt-5 mb-2 text-base font-bold" : "mt-4 mb-1.5 text-sm font-semibold";
      blocks.push(<div key={i} className={cls}>{inline(h[2], i)}</div>);
      i += 1;
    } else if (line.includes("|") && lines[i + 1] && isTableSep(lines[i + 1])) {
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(cells(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={`t${i}`} className="my-3 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead className="bg-[var(--surface-muted)]">
              <tr>{head.map((c, k) => <th key={k} className="px-3 py-2 text-right font-semibold">{inline(c, `h${k}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t border-[var(--border)]">
                  {r.map((c, k) => <td key={k} className="px-3 py-2 align-top">{inline(c, `${ri}-${k}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i += 1;
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={`l${i}`} className={`my-2 space-y-1 pr-5 text-sm ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((t, k) => <li key={k}>{inline(t, `li${k}`)}</li>)}
        </Tag>
      );
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*([-*]|\d+\.)\s)/.test(lines[i]) && !(lines[i].includes("|") && lines[i + 1] && isTableSep(lines[i + 1]))) {
        para.push(lines[i]);
        i += 1;
      }
      blocks.push(<p key={`p${i}`} className="my-2 text-sm leading-7">{inline(para.join(" "), `p${i}`)}</p>);
    }
  }
  return <div dir="rtl">{blocks.map((b, k) => <Fragment key={k}>{b}</Fragment>)}</div>;
}
