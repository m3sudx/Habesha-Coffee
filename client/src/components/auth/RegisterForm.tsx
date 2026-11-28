"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/AuthProvider";
import { applyApiError, safeRedirect } from "@/features/auth/helpers";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { btnPrimary } from "@/components/ui/styles";

export function RegisterForm() {
  const { register: signUp, status } = useAuth();
  const router = useRouter();
  const next = safeRedirect(useSearchParams().get("next"));
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await signUp({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
    } catch (err) {
      applyApiError(err, setError, setFormError, ["name", "email", "password"]);
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
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        hint="At least 8 characters"
        error={errors.password?.message}
        {...register("password")}
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <button type="submit" disabled={isSubmitting} className={`${btnPrimary} mt-2 py-3.5`}>
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
