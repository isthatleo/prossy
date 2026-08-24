"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageSquarePlus, Send } from "lucide-react"
import { toast } from "sonner"

import {
  sendMessageAction,
  startConversationAction,
} from "@/app/(dashboard)/messages/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function NewChatDialog({
  partners,
}: {
  partners: Array<{ id: string; name: string; role: string }>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [selected, setSelected] = useState("")

  async function start() {
    if (!selected) return
    setStarting(true)
    const result = await startConversationAction(selected)
    setStarting(false)
    if (!result.ok || !result.conversationId) {
      toast.error(result.error)
      return
    }
    setOpen(false)
    router.push(`/messages?c=${result.conversationId}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="w-full">
            <MessageSquarePlus data-icon="inline-start" /> New chat
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>
            Pick someone to message — the thread opens right away.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {partners.map((partner) => (
            <button
              key={partner.id}
              type="button"
              onClick={() => setSelected(partner.id)}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                selected === partner.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border hover:bg-muted/60"
              }`}
            >
              <span className="font-medium">{partner.name}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {partner.role}
              </span>
            </button>
          ))}
          {partners.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No one available to message yet.
            </p>
          ) : null}
        </div>

        <Button disabled={!selected || starting} onClick={() => void start()}>
          {starting ? <Loader2 className="size-4 animate-spin" /> : null}
          Start chat
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function Composer({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [sending, setSending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (!String(formData.get("body") ?? "").trim()) return
    setSending(true)
    const result = await sendMessageAction(conversationId, formData)
    setSending(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    formRef.current?.reset()
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        name="body"
        rows={1}
        maxLength={4000}
        onKeyDown={onKeyDown}
        placeholder="Write a message… (Enter to send)"
        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 max-h-40 min-h-9 flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-none"
      />
      <Button type="submit" size="icon" aria-label="Send" disabled={sending}>
        {sending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </form>
  )
}
