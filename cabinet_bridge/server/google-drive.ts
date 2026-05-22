import { log } from "./log";
import fs from "node:fs/promises";
import path from "node:path";
import { storage } from "./storage";

interface DriveTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

/**
 * Gets a fresh access token using the refresh token from settings.
 */
async function getAccessToken(): Promise<string> {
  const settings = await storage.getIntegrationSettings();
  if (!settings.googleDriveRefreshToken || !settings.googleDriveClientId || !settings.googleDriveClientSecret) {
    throw new Error("Google Drive credentials incomplete in Settings.");
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 60000) {
    return cachedAccessToken;
  }

  log("Refreshing Google Drive access token...", "cloud");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: settings.googleDriveClientId,
      client_secret: settings.googleDriveClientSecret,
      refresh_token: settings.googleDriveRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh Google Drive token: ${err}`);
  }

  const data = await res.json() as DriveTokenResponse;
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  return cachedAccessToken;
}

/**
 * Ensures the 'HomeArcade_Saves' folder exists in Google Drive.
 * Returns the folder ID.
 */
export async function ensureDriveFolder(): Promise<string> {
  const settings = await storage.getIntegrationSettings();
  const token = await getAccessToken();

  // If we already have a folder ID, verify it exists
  if (settings.googleDriveFolderId) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${settings.googleDriveFolderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) return settings.googleDriveFolderId;
  }

  log("Finding or creating 'HomeArcade_Saves' folder in Google Drive...", "cloud");
  
  // Search for existing folder
  const query = encodeURIComponent("name = 'HomeArcade_Saves' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json() as { files: Array<{ id: string }> };

  if (searchData.files?.length > 0) {
    const folderId = searchData.files[0].id;
    await storage.saveIntegrationSettings({ ...settings, googleDriveFolderId: folderId });
    return folderId;
  }

  // Create new folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "HomeArcade_Saves",
      mimeType: "application/vnd.google-apps.folder"
    })
  });
  const folder = await createRes.json() as { id: string };
  await storage.saveIntegrationSettings({ ...settings, googleDriveFolderId: folder.id });
  return folder.id;
}

/**
 * Uploads a local file to the Google Drive saves folder.
 * If file exists, it updates it.
 */
export async function uploadToDrive(localPath: string, driveFileName: string): Promise<void> {
  const token = await getAccessToken();
  const folderId = await ensureDriveFolder();

  // 1. Check if file exists to decide whether to update or create
  const query = encodeURIComponent(`name = '${driveFileName}' and '${folderId}' in parents and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json() as { files: Array<{ id: string }> };
  const existingFileId = searchData.files?.[0]?.id;

  const fileContent = await fs.readFile(localPath);
  const metadata = {
    name: driveFileName,
    parents: existingFileId ? undefined : [folderId]
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([fileContent]));

  const url = existingFileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const res = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${err}`);
  }
}

/**
 * Downloads a file from Google Drive if it's newer than the local version.
 */
export async function downloadFromDrive(driveFileName: string, localPath: string): Promise<boolean> {
  const token = await getAccessToken();
  const folderId = await ensureDriveFolder();

  const query = encodeURIComponent(`name = '${driveFileName}' and '${folderId}' in parents and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json() as { files: Array<{ id: string, modifiedTime: string }> };
  const driveFile = searchData.files?.[0];

  if (!driveFile) return false;

  // Check local mtime
  try {
    const localStat = await fs.stat(localPath);
    const driveTime = new Date(driveFile.modifiedTime).getTime();
    if (localStat.mtimeMs >= driveTime) return false; // Local is newer or same
  } catch {
    // Local doesn't exist, proceed with download
  }

  log(`Downloading newer version of ${driveFileName} from Google Drive...`, "cloud");
  const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!downloadRes.ok) return false;

  const buf = Buffer.from(await downloadRes.arrayBuffer());
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, buf);
  return true;
}
