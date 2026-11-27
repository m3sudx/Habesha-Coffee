import type { Metadata } from "next";
import { AccountView } from "@/components/auth/AccountView";
import { RequireAuth } from "@/features/auth/RequireAuth";

export const metadata: Metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountView />
    </RequireAuth>
  );
}
