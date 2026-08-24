import { getStorageClient } from "@/lib/storage/supabase"

const AVATARS_BUCKET = "avatars"
const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function extensionFor(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    default:
      return "jpg"
  }
}

/** Extracts `avatars/<path>` from a stored public URL, if it points at our bucket. */
export function avatarPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

/**
 * Validates and uploads a profile picture to the public avatars bucket.
 * Returns the permanent public URL to store on the user row.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  if (file.size === 0) throw new Error("Image is empty.")
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Image exceeds the 5 MB limit.")
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Use a PNG, JPG or WebP image.")
  }

  const path = `${userId}/${Date.now()}.${extensionFor(file.type)}`
  const { error } = await getStorageClient()
    .storage.from(AVATARS_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = getStorageClient()
    .storage.from(AVATARS_BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}

/** Best-effort cleanup of a previously uploaded avatar object. */
export async function deleteAvatar(url: string): Promise<void> {
  const path = avatarPathFromUrl(url)
  if (!path) return
  await getStorageClient()
    .storage.from(AVATARS_BUCKET)
    .remove([path])
}
