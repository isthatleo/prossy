import { z } from "zod"

export const startConversationSchema = z.object({
  userId: z.uuid(),
})

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message is empty.").max(4000),
})
