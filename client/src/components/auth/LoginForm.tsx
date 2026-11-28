"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { applyApiError, safeRedirect } from "@/features/auth/helpers";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { btnPrimary } from "@/components/ui/styles";

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const next = safeRedirect(useSearchParams().get("next"));
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // Already logged in, or just logged in: go to where the user was headed.
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
    } catch (err) {
      applyApiError(err, setError, setFormError, ["email", "password"]);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
          {formError}
        </p>
      )}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <button type="submit" disabled={isSubmitting} className={`${btnPrimary} mt-2 py-3.5`}>
        {isSubmitting ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}
