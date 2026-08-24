import { z } from "zod"

export const SUBMISSION_TYPES = [
  "chapter_1",
  "chapter_2",
  "chapter_3",
  "chapter_4",
  "progress_report",
  "draft_report",
  "final_report",
  "other",
] as const

export type SubmissionTypeValue = (typeof SUBMISSION_TYPES)[number]

const optionalText = (max: number) =>
  z
    .string()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .or(z.literal(""))

export const createProposalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(200, "Title must be at most 200 characters."),
  abstract: optionalText(5000),
  objectives: optionalText(5000),
  methodology: optionalText(5000),
})

export type CreateProposalInput = z.infer<typeof createProposalSchema>

export const createDocumentSchema = z.object({
  type: z.enum(SUBMISSION_TYPES),
  description: optionalText(2000),
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>

export const reviewDecisionSchema = z.object({
  decision: z.enum(["start_review", "approve", "request_revision", "reject"]),
  notes: z.string().trim().max(3000).optional(),
})

export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>
