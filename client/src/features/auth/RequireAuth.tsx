"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { btnPrimary } from "@/components/ui/styles";

// Wrap a page's content with this to make it login-only. Add role="admin" for admin pages.
//   <RequireAuth> ...account content... </RequireAuth>
//   <RequireAuth role="admin"> ...admin content... </RequireAuth>
// The real protection is always the backend (it returns 401/403); this only controls what the page shows.
export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "admin";
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6" aria-busy="true">
        <div className="h-10 w-56 animate-pulse rounded-full bg-sand" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (role && user?.role !== role) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-terracotta">403</p>
        <h1 className="text-3xl font-medium">You do not have access to this page</h1>
        <Link href="/" className={btnPrimary}>
          Back to home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
