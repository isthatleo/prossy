import { ArrowLeft, BookOpen, CalendarDays, HardDrive, Tag, User } from "lucide-react"
import Link from "next/link"

import {
  DeleteResourceButton,
  DownloadResourceButton,
} from "@/components/resources/resource-ui"
import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireUser } from "@/lib/auth/guards"
import { formatBytes, formatDateTime, formatRelative, humanize } from "@/lib/format"
import type { UserRole } from "@/lib/rbac"
import { getResourceDetail } from "@/services/resources"

export const metadata = { title: "Resource" }

const VISIBILITY_VARIANT: Record<string, "secondary" | "outline" | "warning"> = {
  everyone: "secondary",
  project: "outline",
  private: "warning",
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-medium">{value}</span>
      </span>
    </div>
  )
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session] = await Promise.all([params, requireUser()])
  const role = session.user.role as UserRole

  const resource = await getResourceDetail(id, session.user.id, role)

  if (!resource) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="glass mt-10 shadow-none">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <BookOpen className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Resource not available</p>
            <p className="text-sm text-muted-foreground">
              It may have been removed, or it is not shared with you.
            </p>
            <Button render={<Link href="/resources" />} size="sm" variant="outline" className="mt-2">
              Back to library
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canDelete = role === "admin" || resource.uploadedBy === session.user.id

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/resources"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Library
      </Link>

      <PageHeader title={resource.title} description={humanize(resource.category)}>
        <Badge variant={VISIBILITY_VARIANT[resource.visibility] ?? "outline"}>
          {humanize(resource.visibility)}
        </Badge>
      </PageHeader>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="glass shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">About this resource</CardTitle>
              <CardDescription>{resource.fileName}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {resource.description ? (
                <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
                  {resource.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/60">No description provided.</p>
              )}
              <Separator className="my-4" />
              <div className="flex flex-wrap items-center gap-3">
                <DownloadResourceButton
                  fileId={resource.fileId}
                  size="default"
                  label={`Download (${formatBytes(resource.sizeBytes)})`}
                />
                {canDelete ? (
                  <DeleteResourceButton resourceId={resource.id} title={resource.title} />
                ) : null}
              </div>
            </CardContent>
          </Card>

          {resource.projectId && resource.projectTitle ? (
            <Card className="glass shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Linked project</CardTitle>
                <CardDescription>Shared with this project&apos;s members.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/projects/${resource.projectId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {resource.projectTitle}
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="glass h-fit shadow-none">
          <CardHeader className="pb-1.5">
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/40 pt-0">
            <DetailRow icon={HardDrive} label="File size" value={formatBytes(resource.sizeBytes)} />
            <DetailRow icon={Tag} label="Category" value={humanize(resource.category)} />
            <DetailRow icon={User} label="Uploaded by" value={resource.uploaderName ?? "Member"} />
            <DetailRow
              icon={CalendarDays}
              label="Uploaded"
              value={`${formatRelative(resource.createdAt)} · ${formatDateTime(resource.createdAt)}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
