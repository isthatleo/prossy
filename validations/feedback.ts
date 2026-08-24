import { z } from "zod"

export const addFeedbackSchema = z.object({
  recipientId: z.uuid("Choose a recipient."),
  content: z.string().trim().min(3, "Give at least a sentence.").max(2000),
})

export const resolveFeedbackSchema = z.object({
  feedbackId: z.uuid(),
})

export type AddFeedbackInput = z.infer<typeof addFeedbackSchema>
