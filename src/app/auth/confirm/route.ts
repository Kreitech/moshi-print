import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { nextForConfirmType, type ConfirmType } from "@/lib/auth/next-for-type";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as ConfirmType;
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  const next = searchParams.get("next") ?? nextForConfirmType(type);

  if (providerError) {
    // Supabase already rejected the link (e.g. expired) before we could verify it.
    console.warn("[auth/confirm] provider returned an error before verification", {
      type,
    });
    return NextResponse.redirect(
      `${origin}/auth/error?type=${encodeURIComponent(type ?? "")}`
    );
  }

  // Build redirect first so cookies set during auth are attached to it.
  const redirectResponse = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PKCE code exchange — magic link (and OAuth) redirect back with ?code=
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectResponse;
    console.warn("[auth/confirm] code exchange failed", { type, reason: error.message });
    return NextResponse.redirect(`${origin}/auth/error?type=${encodeURIComponent(type ?? "")}`);
  }

  // Token hash — email confirmation, invite, and recovery (verify-otp style templates)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return redirectResponse;
    console.warn("[auth/confirm] verifyOtp failed", { type, reason: error.message });
    return NextResponse.redirect(`${origin}/auth/error?type=${encodeURIComponent(type ?? "")}`);
  }

  // No query-string params recognized. Supabase's hosted /auth/v1/verify endpoint
  // can redirect back with the session as a URL hash fragment (#access_token=...)
  // instead of a query param when the project uses the implicit flow — fragments
  // are never sent to the server, so a Route Handler alone can't see them. Hand off
  // to a client page that reads the fragment directly and establishes the session
  // in the browser, without ever putting the tokens on the wire to our server.
  const forwardNext =
    next !== nextForConfirmType(null) ? `?next=${encodeURIComponent(next)}` : "";
  return new NextResponse(buildHashShimHtml(`/auth/callback${forwardNext}`), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function buildHashShimHtml(callbackPath: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Verificando enlace…</title>
  </head>
  <body>
    <p style="font-family: sans-serif;">Verificando tu enlace…</p>
    <script>
      var hash = window.location.hash || "";
      window.location.replace(${JSON.stringify(callbackPath)} + hash);
    </script>
  </body>
</html>`;
}
