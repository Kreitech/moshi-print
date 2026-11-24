import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { emailDestination, emailErrorPath, emailFlow } from "@/lib/auth/email-flow";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = emailFlow(searchParams.get("type")) ??
    (searchParams.get("next") === "/update-password" ? "recovery" : null);
  const failure = () => privateRedirect(new URL(emailErrorPath(type), origin));

  if (searchParams.has("error") || searchParams.has("error_description")) return failure();
  if (!code && !token_hash) {
    // A redirect without a fragment preserves the fragment from the email URL.
    const callback = new URL("/auth/callback", origin);
    if (type) callback.searchParams.set("type", type);
    return privateRedirect(callback);
  }
  if (!code && !type) return failure();

  const redirectResponse = privateRedirect(new URL(emailDestination(type), origin));
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

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: type!, token_hash: token_hash! });
  if (!error && data.session) return redirectResponse;
  console.warn("[auth/confirm] Session verification failed", { type, code: error?.code });
  return failure();
}

function privateRedirect(url: URL) {
  return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
}
