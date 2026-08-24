import { z } from "zod"

export const RESOURCE_CATEGORIES = [
  "research",
  "reference",
  "meeting",
  "guideline",
  "project_document",
  "other",
] as const

export const RESOURCE_VISIBILITIES = ["private", "project", "everyone"] as const

export const createResourceSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  category: z.enum(RESOURCE_CATEGORIES),
  visibility: z.enum(RESOURCE_VISIBILITIES),
  projectId: z.uuid().optional(),
})

export type CreateResourceInput = z.infer<typeof createResourceSchema>
