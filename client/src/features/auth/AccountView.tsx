"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Package } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { btnOutline, btnPrimary } from "@/components/ui/styles";

export function AccountView() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium">My Account</h1>

      <dl className="mt-8 grid gap-4 rounded-2xl border border-sand-dark bg-cream p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-brown">Name</dt>
          <dd className="mt-1 font-medium text-forest">{user.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-brown">Email</dt>
          <dd className="mt-1 font-medium text-forest">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-brown">Account type</dt>
          <dd className="mt-1 font-medium capitalize text-forest">{user.role}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/account/orders" className={btnPrimary}>
          <Package size={16} aria-hidden="true" />
          My orders
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          logout();
          router.push("/");
        }}
        className={`${btnOutline} mt-4`}
      >
        <LogOut size={16} aria-hidden="true" />
        Log out
      </button>
    </div>
  );
}
