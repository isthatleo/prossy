"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { uploadAvatarAction } from "@/app/(dashboard)/settings/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AvatarUpload({
  name,
  image,
  size = "size-20",
}: {
  name: string
  image: string | null
  size?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Optimistic preview
    const previewUrl = URL.createObjectURL(file)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const result = await uploadAvatarAction(formData)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Profile picture updated.")
      startTransition(() => router.refresh())
    } finally {
      URL.revokeObjectURL(previewUrl)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="group relative inline-block">
      <Avatar className={`${size} border border-border/60 shadow-md`}>
        {/* key forces re-render when the server image changes after refresh */}
        <AvatarImage src={image ?? undefined} alt={name} />
        <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        aria-label="Change profile picture"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="bg-primary/90 text-primary-foreground absolute -right-1 bottom-0 flex size-7 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Camera className="size-3.5" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="sr-only"
        onChange={(event) => void onPick(event)}
      />
    </div>
  )
}
