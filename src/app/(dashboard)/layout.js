"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      {/* min-w-0 is required here: a flex item's default min-width is "auto",
          meaning it won't shrink below its content's intrinsic width. Without
          it, any wide child anywhere on any page (a table with min-w-[...],
          a chart) pushes this whole column — and with it the entire page —
          wider than the viewport, causing page-level horizontal scroll
          instead of the wide content scrolling within its own container. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
