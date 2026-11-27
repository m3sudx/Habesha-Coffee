"use client";

import { useEffect, useState } from "react";
import { API_ORIGIN } from "@/lib/api/client";

// Temporary check for F0: proves the browser can reach the backend (CORS works).
// Delete this file, and its use in page.tsx, when F1 replaces the page.
export function ApiStatus() {
  const [state, setState] = useState<"checking" | "ok" | "error">("checking");

  useEffect(() => {
    fetch(`${API_ORIGIN}/health`)
      .then((res) => setState(res.ok ? "ok" : "error"))
      .catch(() => setState("error"));
  }, []);

  const label = {
    checking: "Checking the API...",
    ok: "API connected",
    error: "API unreachable (is the backend running, and is CLIENT_URL http://localhost:3000?)",
  }[state];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-sand px-4 py-2 text-sm font-medium">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${
          state === "ok" ? "bg-forest-light" : state === "error" ? "bg-terracotta" : "bg-gold"
        }`}
      />
      {label}
    </span>
  );
}