import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" } };

// Everything under /admin is for admins only. The backend enforces it as well (401/403).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RequireAuth role="admin">
        <AdminShell>{children}</AdminShell>
      </RequireAuth>
    </Suspense>
  );
}
