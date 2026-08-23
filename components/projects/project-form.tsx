"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/(dashboard)/projects/actions"
import { createProjectSchema, type CreateProjectInput } from "@/validations/projects"

interface CategoryOption {
  id: string
  name: string
}

export function ProjectForm({
  categories,
  projectId,
  defaultValues,
}: {
  categories: CategoryOption[]
  projectId?: string
  defaultValues?: Partial<CreateProjectInput>
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      description: defaultValues?.description ?? "",
      problemStatement: defaultValues?.problemStatement ?? "",
      objectives: defaultValues?.objectives ?? "",
      methodology: defaultValues?.methodology ?? "",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      if (projectId) {
        const fd = new FormData()
        fd.set("projectId", projectId)
        for (const [key, value] of Object.entries(values)) {
          fd.set(key, String(value ?? ""))
        }
        const result = await updateProjectAction(null, fd)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success("Project updated.")
        router.push(`/projects/${projectId}`)
      } else {
        const fd = new FormData()
        for (const [key, value] of Object.entries(values)) {
          fd.set(key, String(value ?? ""))
        }
        // Redirects to the new project's page on success.
        await createProjectAction(null, fd)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Project title
        </label>
        <Input
          id="title"
          placeholder="e.g. AI-based attendance system using face recognition"
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          value={form.watch("categoryId") ?? ""}
          onValueChange={(value) => form.setValue("categoryId", value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.categoryId ? (
          <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          rows={4}
          placeholder="What is this project about?"
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {(
          [
            ["problemStatement", "Problem statement"],
            ["objectives", "Objectives"],
            ["methodology", "Methodology"],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="flex flex-col gap-2">
            <label htmlFor={field} className="text-sm font-medium">
              {label} <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea id={field} rows={4} {...form.register(field)} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : projectId ? (
            "Save changes"
          ) : (
            "Create project"
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
