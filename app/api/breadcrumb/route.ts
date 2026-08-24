import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth/server"
import { db } from "@/db"
import { projects } from "@/db/schema"

/** Resolves human labels for dynamic route segments (used by the topbar breadcrumbs). */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const path = new URL(request.url).searchParams.get("path") ?? ""
  const projectMatch = /^\/projects\/([0-9a-f-]{36})$/.exec(path)
  if (projectMatch) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectMatch[1]),
      columns: {
        title: true,
        studentId: true,
        supervisorId: true,
      },
    })
    if (
      !project ||
      (session.user.role !== "admin" &&
        session.user.id !== project.studentId &&
        session.user.id !== project.supervisorId)
    ) {
      return NextResponse.json({ label: "Project" })
    }
    return NextResponse.json({ label: project.title })
  }

  return NextResponse.json({ label: null })
}
