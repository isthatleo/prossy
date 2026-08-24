import { z } from "zod"

export const MILESTONE_STATUSES = ["pending", "in_progress", "completed"] as const

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be ${max} characters or fewer.`).optional().or(z.literal(""))

export const createMilestoneSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title must be at most 120 characters."),
  description: optionalText(2000),
  dueDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date.")
    .optional()
    .or(z.literal("")),
})

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>

export const updateMilestoneSchema = createMilestoneSchema.partial()

export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>

export const setMilestoneStatusSchema = z.object({
  status: z.enum(MILESTONE_STATUSES),
})
