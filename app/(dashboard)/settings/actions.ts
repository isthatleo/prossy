"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { requireUser } from "@/lib/auth/guards"
import { auth } from "@/lib/auth/server"
import { deleteAvatar, uploadAvatar } from "@/lib/storage/avatars"

export interface ActionResult {
  ok: boolean
  error?: string
}

function revalidateChrome() {
  // Sidebar/topbar avatars + profile data live in the dashboard layout.
  revalidatePath("/", "layout")
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser()

  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Name must be between 2 and 80 characters." }
  }

  await db.update(users).set({ name }).where(eq(users.id, session.user.id))
  revalidateChrome()
  return { ok: true }
}

export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireUser()

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image first." }
  }

  let newUrl: string
  try {
    newUrl = await uploadAvatar(session.user.id, file)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." }
  }

  const previousImage = session.user.image ?? null
  await db
    .update(users)
    .set({ image: newUrl })
    .where(eq(users.id, session.user.id))

  if (previousImage) {
    await deleteAvatar(previousImage).catch(() => undefined)
  }
  revalidateChrome()
  return { ok: true }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  await requireUser()
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." }
  }

  try {
    const { headers } = await import("next/headers")
    const result = await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: await headers(),
    })
    if (!result) {
      return { ok: false, error: "Could not change password." }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not change password."
    return {
      ok: false,
      error: /invalid/i.test(message)
        ? "Current password is incorrect."
        : message,
    }
  }
  return { ok: true }
}
