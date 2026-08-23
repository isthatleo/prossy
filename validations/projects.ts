import { z } from "zod"

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Title must be at least 8 characters")
    .max(200, "Title must be at most 200 characters"),
  categoryId: z.uuid("Select a category"),
  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters")
    .max(5000),
  problemStatement: z.string().trim().max(5000).optional().or(z.literal("")),
  objectives: z.string().trim().max(5000).optional().or(z.literal("")),
  methodology: z.string().trim().max(5000).optional().or(z.literal("")),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = createProjectSchema.partial()
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export const REVIEW_DECISIONS = ["approve", "request_revision", "reject"] as const
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number]

export const reviewProjectSchema = z.object({
  projectId: z.uuid(),
  decision: z.enum(REVIEW_DECISIONS),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
})
