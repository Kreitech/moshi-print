import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/get-active-tenant";
import { getValidAccessToken, uploadFileToDrive } from "@/lib/storage/drive";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const tenant = await getActiveTenant(supabase);
  if (!tenant) return NextResponse.json({ error: "Sin espacio de trabajo." }, { status: 400 });

  // Load storage connection
  const { data: conn } = await supabase
    .from("tenant_storage_connections")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("provider", "google_drive")
    .single();

  if (!conn) return NextResponse.json({ error: "Google Drive no conectado." }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const entityType = formData.get("entity_type") as string;
  const entityId = formData.get("entity_id") as string;
  const fileCategory = (formData.get("file_category") as string) || "other";

  if (!file || !entityType || !entityId) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  // Get valid access token (refresh if needed)
  let accessToken: string;
  try {
    const result = await getValidAccessToken(conn);
    accessToken = result.accessToken;
    if (result.newAccessTokenEnc && result.newExpiry) {
      await supabase
        .from("tenant_storage_connections")
        .update({ access_token_enc: result.newAccessTokenEnc, token_expiry: result.newExpiry.toISOString() })
        .eq("id", conn.id);
    }
  } catch {
    return NextResponse.json({ error: "Error al obtener acceso a Google Drive." }, { status: 500 });
  }

  // Upload to Drive
  let driveFile;
  try {
    driveFile = await uploadFileToDrive(accessToken, conn.drive_folder_id, file, file.name, file.type || "application/octet-stream");
  } catch {
    return NextResponse.json({ error: "Error al subir el archivo a Google Drive." }, { status: 500 });
  }

  // Save file record to DB
  const { data: fileRecord, error: dbError } = await supabase
    .from("files")
    .insert({
      tenant_id: tenant.id,
      entity_type: entityType,
      entity_id: entityId,
      storage_connection_id: conn.id,
      drive_file_id: driveFile.id,
      file_name: driveFile.name,
      mime_type: driveFile.mimeType,
      size_bytes: driveFile.size ?? null,
      file_category: fileCategory,
      web_view_link: driveFile.webViewLink,
      uploaded_by_user_id: user.id,
    })
    .select()
    .single();

  if (dbError || !fileRecord) {
    return NextResponse.json({ error: "Error al guardar el archivo." }, { status: 500 });
  }

  return NextResponse.json({ file: fileRecord });
}
