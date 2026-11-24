"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { emailDestination, emailErrorPath, emailFlow } from "@/lib/auth/email-flow";

export default function EmailCallbackPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function confirmSession() {
      const url = new URL(window.location.href);
      const fragment = new URLSearchParams(url.hash.slice(1));
      const type = emailFlow(fragment.get("type")) ?? emailFlow(url.searchParams.get("type"));
      const access_token = fragment.get("access_token");
      const refresh_token = fragment.get("refresh_token");
      const failure = emailErrorPath(type);
      window.history.replaceState(window.history.state, "", url.pathname + url.search);

      if (!access_token || !refresh_token || fragment.has("error")) {
        window.location.replace(failure);
        return;
      }

      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { isSingleton: false },
        );
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error && data.session) {
          window.location.replace(emailDestination(type));
          return;
        }
        console.warn("[auth/callback] Session setup failed", { type, code: error?.code });
      } catch {
        console.warn("[auth/callback] Session setup failed", { type });
      }
      window.location.replace(failure);
    }

    void confirmSession();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p role="status" className="text-sm text-muted-foreground">Verificando tu enlace…</p>
    </main>
  );
}
