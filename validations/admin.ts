import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
})

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(12)
    .regex(/^[A-Za-z0-9-]+$/, "Code must be letters, numbers or dashes."),
})

export const setUserActiveSchema = z.object({
  userId: z.uuid(),
  isActive: z.boolean(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
