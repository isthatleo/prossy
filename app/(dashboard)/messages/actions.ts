"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/guards"
import {
  getOrCreateDirectConversation,
  markConversationRead,
  sendMessage,
} from "@/services/messaging"
import { sendMessageSchema } from "@/validations/messaging"

export interface ActionResult {
  ok: boolean
  error?: string
  conversationId?: string
}

export async function startConversationAction(
  otherUserId: string
): Promise<ActionResult> {
  const session = await requireUser()
  try {
    const conversationId = await getOrCreateDirectConversation(
      session.user.id,
      otherUserId
    )
    revalidatePath("/messages")
    return { ok: true, conversationId }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }
}

export async function sendMessageAction(
  conversationId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const parsed = sendMessageSchema.safeParse({
    body: formData.get("body") ?? "",
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }

  try {
    await sendMessage(
      conversationId,
      session.user.id,
      session.user.name,
      parsed.data.body
    )
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed." }
  }

  revalidatePath("/messages")
  return { ok: true, conversationId }
}

export async function markConversationReadAction(
  conversationId: string
): Promise<void> {
  const session = await requireUser()
  await markConversationRead(conversationId, session.user.id)
}
