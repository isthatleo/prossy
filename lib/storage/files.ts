import { randomUUID } from "crypto"

import { getStorageClient, STORAGE_BUCKET } from "@/lib/storage/supabase"

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
])

export interface StoredFile {
  storageKey: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120)
}

/** Validates and uploads a file under `projects/<projectId>/<uuid>/<name>`. */
export async function uploadProjectFile(
  file: File,
  projectId: string
): Promise<StoredFile> {
  if (file.size === 0) throw new Error("File is empty.")
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds the 25 MB limit.")
  }
  const mimeType = file.type || "application/octet-stream"
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  const fileName = sanitizeFileName(file.name || "file")
  const storageKey = `projects/${projectId}/${randomUUID()}/${fileName}`

  const { error } = await getStorageClient()
    .storage.from(STORAGE_BUCKET)
    .upload(storageKey, await file.arrayBuffer(), {
      contentType: mimeType,
      upsert: false,
    })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  return { storageKey, fileName, mimeType, sizeBytes: file.size }
}

/** Short-lived signed URL for downloading a stored file. */
export async function getFileDownloadUrl(
  storageKey: string,
  expiresInSeconds = 600
): Promise<string> {
  const { data, error } = await getStorageClient()
    .storage.from(STORAGE_BUCKET)
    .createSignedUrl(storageKey, expiresInSeconds)
  if (error || !data) throw new Error("Could not create download link.")
  return data.signedUrl
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  const { error } = await getStorageClient()
    .storage.from(STORAGE_BUCKET)
    .remove([storageKey])
  if (error) throw new Error(`Delete failed: ${error.message}`)
}
