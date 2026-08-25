"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  submitDocumentAction,
  submitProposalAction,
} from "@/app/(dashboard)/projects/[id]/actions"
import { validateFile } from "@/lib/file-validation"

export function ProposalForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const file = formData.get("file") as File | null
    if (file && file.size > 0) {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
    }

    const result = await submitProposalAction(projectId, formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Proposal submitted for review.")
    formRef.current?.reset()
    setFileName(null)
    startTransition(() => router.refresh())
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="proposal-title">Title *</Label>
        <Input
          id="proposal-title"
          name="title"
          required
          minLength={5}
          maxLength={200}
          placeholder="Final year project proposal"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="proposal-abstract">Abstract</Label>
          <textarea
            id="proposal-abstract"
            name="abstract"
            rows={3}
            className="border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            placeholder="A concise summary of the proposed work."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proposal-objectives">Objectives</Label>
          <textarea
            id="proposal-objectives"
            name="objectives"
            rows={3}
            className="border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            placeholder="What will this project achieve?"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proposal-methodology">Methodology</Label>
          <textarea
            id="proposal-methodology"
            name="methodology"
            rows={3}
            className="border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            placeholder="How will you carry out the work?"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proposal-file">Attachment (PDF/DOCX, max 25 MB)</Label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
          <FileUp className="size-4 shrink-0" />
          <span className="truncate">{fileName ?? "Choose a file…"}</span>
          <Input
            id="proposal-file"
            name="file"
            type="file"
            className="sr-only"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.md,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        Submit proposal
      </Button>
    </form>
  )
}

export function DocumentForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState("chapter_1")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const file = formData.get("file") as File | null
    if (file && file.size > 0) {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
    }

    const result = await submitDocumentAction(projectId, formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Document submitted for review.")
    formRef.current?.reset()
    setFileName(null)
    startTransition(() => router.refresh())
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={selectedType} onValueChange={(v) => v && setSelectedType(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chapter_1">Chapter 1</SelectItem>
              <SelectItem value="chapter_2">Chapter 2</SelectItem>
              <SelectItem value="chapter_3">Chapter 3</SelectItem>
              <SelectItem value="chapter_4">Chapter 4</SelectItem>
              <SelectItem value="progress_report">Progress report</SelectItem>
              <SelectItem value="draft_report">Draft report</SelectItem>
              <SelectItem value="final_report">Final report</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="type" value={selectedType} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="document-description">Description</Label>
          <Input
            id="document-description"
            name="description"
            maxLength={500}
            placeholder="Optional note for your reviewer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="document-file">File * (PDF/DOCX, max 25 MB)</Label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
          <FileUp className="size-4 shrink-0" />
          <span className="truncate">{fileName ?? "Choose a file…"}</span>
          <Input
            id="document-file"
            name="file"
            type="file"
            required
            className="sr-only"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.md,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        Submit document
      </Button>
    </form>
  )
}
