import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "recovery"
    | "magiclink"
    | "invite"
    | null;
  // Recovery → password update; new signups → onboarding; everything else → dashboard
  const defaultNext =
    type === "recovery"
      ? "/update-password"
      : type === "signup"
        ? "/onboarding"
        : "/dashboard";
  const next = searchParams.get("next") ?? defaultNext;

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
    if (!error) {
      return redirectResponse;
    }
  }

  // Token hash — email confirmation and password recovery
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
