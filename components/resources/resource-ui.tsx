"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CloudUpload, Download, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createResourceAction,
  deleteResourceAction,
} from "@/app/(dashboard)/resources/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SELECT_CLASS =
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"

export function UploadResourceDialog({
  categories,
  projects,
}: {
  categories: readonly string[]
  projects: Array<{ id: string; title: string }>
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setUploading(true)
    const result = await createResourceAction(formData)
    setUploading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Resource published.")
    setOpen(false)
    form.reset()
    setFileName(null)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <CloudUpload data-icon="inline-start" /> Upload resource
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share a resource</DialogTitle>
          <DialogDescription>
            Files up to 25 MB. Visibility controls who can find and download it.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="res-title">Title *</Label>
            <Input id="res-title" name="title" required minLength={3} maxLength={120} />
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") fileRef.current?.click()
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              if (event.dataTransfer.files.length > 0 && fileRef.current) {
                fileRef.current.files = event.dataTransfer.files
                setFileName(event.dataTransfer.files[0].name)
              }
            }}
            className="border-border hover:border-primary/60 hover:bg-muted/40 flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors"
          >
            <CloudUpload className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">
              {fileName ?? "Click or drop a file here"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, Word, slides, zip…</p>
            <input
              ref={fileRef}
              type="file"
              name="file"
              required
              hidden
              onChange={(event) =>
                setFileName(event.target.files?.[0]?.name ?? null)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="res-category">Category</Label>
              <select id="res-category" name="category" defaultValue="research" className={SELECT_CLASS}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-visibility">Visibility</Label>
              <select id="res-visibility" name="visibility" defaultValue="project" className={SELECT_CLASS}>
                <option value="private">Private (just me)</option>
                {projects.length > 0 ? <option value="project">Project members</option> : null}
                <option value="everyone">Everyone</option>
              </select>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="res-project">Project (for project visibility)</Label>
              <select id="res-project" name="projectId" className={SELECT_CLASS} defaultValue="">
                <option value="">— none —</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="res-desc">Description</Label>
            <textarea
              id="res-desc"
              name="description"
              rows={2}
              maxLength={500}
              className={`${SELECT_CLASS} h-auto py-2`}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 data-icon="inline-start" className="size-4 animate-spin" /> Uploading…
                </>
              ) : (
                "Publish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteResourceButton({
  resourceId,
  title,
}: {
  resourceId: string
  title: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [pending, startTransition] = useTransition()

  async function remove() {
    if (!window.confirm(`Delete "${title}"?`)) return
    setBusy(true)
    const result = await deleteResourceAction(resourceId)
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Resource deleted.")
    startTransition(() => router.refresh())
  }

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label="Delete resource"
      disabled={busy || pending}
      onClick={() => void remove()}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5 text-muted-foreground" />
      )}
    </Button>
  )
}

export function DownloadResourceButton({ fileId }: { fileId: string }) {
  return (
    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" render={
      <a href={`/api/files/${fileId}`}>
        <Download data-icon="inline-start" className="size-3.5" /> Download
      </a>
    } />
  )
}
