"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nextForConfirmType, type ConfirmType } from "@/lib/auth/next-for-type";

// Establishes a Supabase session from an implicit-flow URL hash fragment
// (#access_token=...&refresh_token=...&type=...) that /auth/confirm could not
// read server-side, then redirects to the right screen for that link type.
function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");
    const type = (hashParams.get("type") as ConfirmType) ?? null;
    const next = searchParams.get("next") ?? nextForConfirmType(type);

    if (!access_token || !refresh_token) {
      console.warn("[auth/callback] no session fragment found in URL");
      router.replace(`/auth/error?type=${encodeURIComponent(type ?? "")}`);
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        console.warn("[auth/callback] setSession failed", { type, reason: error.message });
        router.replace(`/auth/error?type=${encodeURIComponent(type ?? "")}`);
        return;
      }
      router.replace(next);
    });
    // Runs once on mount to consume the one-time fragment; router/searchParams are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">Verificando tu enlace…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <p className="text-sm text-muted-foreground">Verificando tu enlace…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
