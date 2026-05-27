import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
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

  if (token_hash && type) {
    // Build redirect first so cookies set during verifyOtp are attached to it,
    // not lost on a separate response object.
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

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
