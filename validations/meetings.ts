import { z } from "zod"

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be ${max} characters or fewer.`).optional().or(z.literal(""))

export const scheduleMeetingSchema = z.object({
  projectId: z.uuid("Choose a project."),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title must be at most 120 characters."),
  startAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Pick a valid date and time.")
    .refine(
      (value) => Date.parse(value) > Date.now() - 60 * 1000,
      "The meeting must be in the future."
    ),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, "Minimum duration is 15 minutes.")
    .max(240, "Maximum duration is 4 hours.")
    .default(30),
  location: optionalText(160),
  agenda: optionalText(2000),
})

export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>

export const MEETING_ACTIONS = ["complete", "cancel"] as const

export type MeetingAction = (typeof MEETING_ACTIONS)[number]
