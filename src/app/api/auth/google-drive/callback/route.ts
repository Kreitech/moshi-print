import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/storage/crypto";
import { createRootFolder } from "@/lib/storage/drive";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const tenantId = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !tenantId) {
    return NextResponse.redirect(`${appUrl}/settings/storage?error=oauth_denied`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/auth/google-drive/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/settings/storage?error=token_exchange`);
  }

  const tokens = await tokenRes.json();
  const accessToken: string = tokens.access_token;
  const refreshToken: string = tokens.refresh_token;
  const expiresIn: number = tokens.expires_in;

  // Get tenant name for folder
  const { data: tenant } = await supabase.from("tenants").select("name").eq("id", tenantId).single();
  const tenantName = tenant?.name ?? "Mi Empresa";

  // Create root folder in Drive
  let folderId: string;
  let folderUrl: string;
  try {
    const folder = await createRootFolder(accessToken, tenantName);
    folderId = folder.id;
    folderUrl = folder.url;
  } catch {
    return NextResponse.redirect(`${appUrl}/settings/storage?error=folder_creation`);
  }

  // Upsert connection record
  const expiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  const { error: dbError } = await supabase.from("tenant_storage_connections").upsert(
    {
      tenant_id: tenantId,
      provider: "google_drive",
      access_token_enc: encrypt(accessToken),
      refresh_token_enc: encrypt(refreshToken),
      token_expiry: expiry,
      drive_folder_id: folderId,
      drive_folder_url: folderUrl,
      connected_by: user.id,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,provider" }
  );

  if (dbError) {
    return NextResponse.redirect(`${appUrl}/settings/storage?error=db_save`);
  }

  return NextResponse.redirect(`${appUrl}/settings/storage?connected=1`);
}
