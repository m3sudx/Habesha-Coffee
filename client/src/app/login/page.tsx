import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log In" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to check out and see your orders."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-forest underline">
            Create an account
          </Link>
        </>
      }
    >
      {/* LoginForm reads the URL (?next=...), which needs a Suspense boundary */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
