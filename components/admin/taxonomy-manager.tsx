"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createCategoryAction,
  createDepartmentAction,
  deleteCategoryAction,
  deleteDepartmentAction,
} from "@/app/(dashboard)/admin/taxonomy-actions"
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

interface TaxonomyItem {
  id: string
  label: string
  sublabel: string | null
  count: number
}

export function TaxonomyManager({
  kind,
  items,
  noun,
}: {
  kind: "category" | "department"
  items: TaxonomyItem[]
  noun: string
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result =
      kind === "category"
        ? await createCategoryAction(formData)
        : await createDepartmentAction(formData)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(`${noun} created.`)
    setOpen(false)
    formRef.current?.reset()
    startTransition(() => router.refresh())
  }

  async function onDelete(item: TaxonomyItem) {
    if (
      !window.confirm(
        item.count > 0
          ? `"${item.label}" is used by ${item.count} project${item.count === 1 ? "" : "s"}. Deleting will unlink them. Continue?`
          : `Delete "${item.label}"?`
      )
    ) {
      return
    }
    setBusyId(item.id)
    const result =
      kind === "category"
        ? await deleteCategoryAction(item.id)
        : await deleteDepartmentAction(item.id)
    setBusyId(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(`${noun} deleted.`)
    startTransition(() => router.refresh())
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button size="sm">
              <Plus data-icon="inline-start" /> New {noun.toLowerCase()}
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New {noun.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {kind === "category"
                ? "Students pick a category when registering their project."
                : "Departments group students and supervisors; the code is a short unique identifier."}
            </DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={onCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tax-name">Name *</Label>
              <Input id="tax-name" name="name" required minLength={2} maxLength={120} />
            </div>
            {kind === "category" ? (
              <div className="space-y-1.5">
                <Label htmlFor="tax-desc">Description</Label>
                <textarea
                  id="tax-desc"
                  name="description"
                  rows={3}
                  maxLength={300}
                  className="border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="tax-code">Code *</Label>
                <Input
                  id="tax-code"
                  name="code"
                  required
                  minLength={2}
                  maxLength={12}
                  placeholder="e.g. CS"
                  className="uppercase"
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={creating}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ul className="contents">
        {items.map((item) => (
          <li
            key={item.id}
            className="glass flex items-start justify-between gap-3 rounded-lg border border-border px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.label}</p>
              {item.sublabel ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {item.sublabel}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground/70 tabular-nums">
                {item.count} linked project{item.count === 1 ? "" : "s"}
              </p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Delete ${item.label}`}
              disabled={busyId !== null || pending}
              onClick={() => void onDelete(item)}
            >
              {busyId === item.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5 text-muted-foreground" />
              )}
            </Button>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground md:col-span-2">
          No {noun.toLowerCase()}s yet — create the first one.
        </p>
      ) : null}
    </div>
  )
}
