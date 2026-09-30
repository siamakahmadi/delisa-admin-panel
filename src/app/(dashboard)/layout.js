import { cookies } from "next/headers";
import { USER_COOKIE } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

function readUser(raw) {
  if (!raw) return null;
  const candidates = [raw];
  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    // مقدار کوکی از قبل decode شده است.
  }
  for (const value of candidates) {
    try {
      const user = JSON.parse(value);
      if (user && typeof user === "object") return user;
    } catch {
      // فرمت بعدی را امتحان می‌کنیم.
    }
  }
  return null;
}

export default async function DashboardLayout({ children }) {
  const raw = (await cookies()).get(USER_COOKIE)?.value ?? null;
  return <DashboardShell user={readUser(raw)}>{children}</DashboardShell>;
}
