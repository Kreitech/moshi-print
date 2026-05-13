import { decrypt, encrypt } from "./crypto";

export interface StorageConnection {
  id: string;
  access_token_enc: string;
  refresh_token_enc: string;
  token_expiry: string;
  drive_folder_id: string;
  drive_folder_url: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink: string;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expiry: Date }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  return {
    access_token: data.access_token,
    expiry: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function getValidAccessToken(conn: StorageConnection): Promise<{
  accessToken: string;
  newExpiry?: Date;
  newAccessTokenEnc?: string;
}> {
  const accessToken = decrypt(conn.access_token_enc);
  const expiry = new Date(conn.token_expiry);
  if (expiry.getTime() - Date.now() > 5 * 60 * 1000) {
    return { accessToken };
  }
  const refreshToken = decrypt(conn.refresh_token_enc);
  const refreshed = await refreshAccessToken(refreshToken);
  return {
    accessToken: refreshed.access_token,
    newExpiry: refreshed.expiry,
    newAccessTokenEnc: encrypt(refreshed.access_token),
  };
}

export async function createRootFolder(accessToken: string, tenantName: string): Promise<{ id: string; url: string }> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `MoshiPrint — ${tenantName}`,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create Drive folder: ${res.status}`);
  const data = await res.json();
  return { id: data.id, url: data.webViewLink };
}

export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  file: File | Blob,
  fileName: string,
  mimeType: string
): Promise<DriveFile> {
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const boundary = "moshi_boundary_" + Math.random().toString(36).slice(2);
  const fileBuffer = await file.arrayBuffer();

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    Buffer.from(fileBuffer),
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${err}`);
  }
  return res.json();
}
