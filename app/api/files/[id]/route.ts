import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth/server"
import { db } from "@/db"
import { files, projects, resources } from "@/db/schema"
import { getFileDownloadUrl } from "@/lib/storage/files"

const STORAGE_KEY_PROJECT = /^projects\/([0-9a-f-]{36})\//

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: _request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const file = await db.query.files.findFirst({ where: eq(files.id, id) })
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const user = session.user
  let allowed = file.uploadedBy === user.id || user.role === "admin"

  if (!allowed) {
    // Project-scoped files live under projects/<projectId>/…
    const match = STORAGE_KEY_PROJECT.exec(file.storageKey)
    if (match) {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, match[1]),
        columns: { studentId: true, supervisorId: true },
      })
      allowed =
        !!project &&
        (project.studentId === user.id || project.supervisorId === user.id)
    }
  }

  if (!allowed) {
    // Library resources grant access through their own visibility rules.
    const resource = await db.query.resources.findFirst({
      where: eq(resources.fileId, file.id),
      columns: { visibility: true, projectId: true },
    })
    if (resource) {
      if (resource.visibility === "everyone") {
        allowed = true
      } else if (resource.visibility === "private") {
        allowed = false
      } else if (resource.projectId) {
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, resource.projectId),
          columns: { studentId: true, supervisorId: true },
        })
        allowed =
          !!project &&
          (project.studentId === user.id || project.supervisorId === user.id)
      }
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const url = await getFileDownloadUrl(file.storageKey)
    return NextResponse.redirect(url, 302)
  } catch {
    return NextResponse.json(
      { error: "Could not generate download link." },
      { status: 500 }
    )
  }
}
