"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  addFeedbackAction,
  resolveFeedbackAction,
} from "@/app/(dashboard)/projects/[id]/feedback-actions"
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

export function FeedbackComposer({
  projectId,
  recipients,
}: {
  projectId: string
  recipients: Array<{ id: string; name: string; role: string }>
}) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState(recipients[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  if (recipients.length === 0) return null

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set("recipientId", selectedRecipient)
    const result = await addFeedbackAction(projectId, formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Feedback sent.")
    setContent("")
    startTransition(() => router.refresh())
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {recipients.length > 1 ? (
        <div className="space-y-1.5">
          <Label htmlFor="feedback-recipient">To</Label>
          <Select value={selectedRecipient} onValueChange={(v) => v && setSelectedRecipient(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name} ({person.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="recipientId" value={selectedRecipient} />
        </div>
      ) : (
        <Input type="hidden" name="recipientId" value={recipients[0]?.id ?? ""} />
      )}
      <div className="space-y-1.5">
        <Label htmlFor="feedback-content">Feedback</Label>
        <textarea
          id="feedback-content"
          name="content"
          required
          minLength={3}
          maxLength={2000}
          rows={3}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share specific, actionable feedback…"
          className="border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || content.trim().length < 3}>
        Send feedback
      </Button>
    </form>
  )
}

export function ResolveFeedbackButton({
  projectId,
  feedbackId,
}: {
  projectId: string
  feedbackId: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [pending, startTransition] = useTransition()

  async function resolve() {
    setBusy(true)
    const result = await resolveFeedbackAction(projectId, feedbackId)
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success("Marked as resolved.")
    startTransition(() => router.refresh())
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 px-2.5 text-xs"
      disabled={busy || pending}
      onClick={() => void resolve()}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Check data-icon="inline-start" className="size-3.5" />
      )}
      Mark resolved
    </Button>
  )
}
