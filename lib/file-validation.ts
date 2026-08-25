const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
])

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".ppt", ".pptx",
  ".zip", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp",
])

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    const mb = Math.round(file.size / (1024 * 1024))
    return `File is ${mb} MB — maximum allowed is 25 MB.`
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `File type "${ext}" is not allowed. Use PDF, DOCX, PPTX, ZIP, TXT, MD, PNG, JPG or WebP.`
  }

  if (ALLOWED_MIME_TYPES.size > 0 && !ALLOWED_MIME_TYPES.has(file.type)) {
    if (file.type) {
      return `File type "${file.type}" is not allowed.`
    }
  }

  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
