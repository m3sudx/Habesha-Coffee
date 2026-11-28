"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";

// The login area of the header. Shows Log In / Sign Up for guests,
// and the user's name with a Log out button for logged-in users.
// variant "desktop" is the row in the header bar; "mobile" is the list inside the phone menu.
export function AccountNav({ variant }: { variant: "desktop" | "mobile" }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  const firstName = user?.name.split(" ")[0];

  if (variant === "mobile") {
    const item = "block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-forest hover:bg-sand";
    if (status === "authenticated") {
      return (
        <>
          <Link href="/account" className={item}>
            My Account
          </Link>
          <button type="button" onClick={handleLogout} className={item}>
            Log out
          </button>
        </>
      );
    }
    return (
      <>
        <Link href="/login" className={item}>
          Log In
        </Link>
        <Link href="/register" className={item}>
          Sign Up
        </Link>
      </>
    );
  }

  // While the saved login is being checked, keep the space so the header doesn't jump.
  if (status === "loading") {
    return <div className="hidden h-11 w-44 sm:block" aria-hidden="true" />;
  }

  if (status === "authenticated") {
    return (
      <div className="hidden items-center gap-1 sm:flex">
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-forest hover:text-terracotta"
        >
          <User size={18} aria-hidden="true" />
          {firstName}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className="flex h-10 w-10 items-center justify-center rounded-full text-forest hover:bg-sand"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 sm:flex">
      <Link href="/login" className="px-3 py-2 text-sm font-medium text-forest hover:text-terracotta">
        Log In
      </Link>
      <Link
        href="/register"
        className="rounded-full border-2 border-forest px-5 py-2 text-sm font-semibold text-forest hover:bg-forest hover:text-cream"
      >
        Sign Up
      </Link>
    </div>
  );
}
