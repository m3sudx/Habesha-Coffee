import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";

// After login the user goes back to where they came from (?next=/checkout).
// Only same-site paths are accepted, so a crafted link can't send people to another website.
export function safeRedirect(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}

// Shows a backend error in the form: field errors under their fields, anything else at the top.
export function applyApiError<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  setFormError: (message: string) => void,
  fields: readonly Path<T>[],
) {
  if (!(err instanceof ApiError)) {
    setFormError("Something went wrong. Please try again.");
    return;
  }

  // "Email already registered"
  if (err.status === 409) {
    setError("email" as Path<T>, { message: err.message });
    return;
  }

  // Validation errors: [{ field, message }]
  const details = Array.isArray(err.details) ? err.details : [];
  let shown = false;
  for (const item of details as { field?: unknown; message?: unknown }[]) {
    if (
      typeof item.field === "string" &&
      typeof item.message === "string" &&
      fields.includes(item.field as Path<T>)
    ) {
      setError(item.field as Path<T>, { message: item.message });
      shown = true;
    }
  }
  if (!shown) setFormError(err.message);
}
