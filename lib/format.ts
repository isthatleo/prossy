export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function formatRelative(date: Date | string): string {
  const target = new Date(date)
  const diffMs = target.getTime() - Date.now()
  const absMinutes = Math.abs(Math.round(diffMs / 60000))

  let value: number
  let unit: Intl.RelativeTimeFormatUnit
  if (absMinutes < 60) {
    value = Math.round(diffMs / 60000)
    unit = "minute"
  } else if (absMinutes < 60 * 24) {
    value = Math.round(diffMs / 3600000)
    unit = "hour"
  } else if (absMinutes < 60 * 24 * 30) {
    value = Math.round(diffMs / 86400000)
    unit = "day"
  } else {
    value = Math.round(diffMs / (86400000 * 30))
    unit = "month"
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  return rtf.format(value, unit)
}

export function humanize(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
