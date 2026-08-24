"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  new: "New project",
  edit: "Edit",
  students: "Students",
  supervisors: "Supervisors",
  messages: "Messages",
  meetings: "Meetings",
  resources: "Resources",
  reports: "Reports",
  reviews: "Reviews",
  notifications: "Notifications",
  settings: "Settings",
  profile: "Profile",
  admin: "Admin",
  departments: "Departments",
  categories: "Categories",
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Crumb {
  href: string
  label: string
  dynamic: boolean
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({})

  const crumbs = useMemo<Crumb[]>(() => {
    const segments = pathname.split("/").filter(Boolean)
    return segments.map((segment, index) => ({
      href: "/" + segments.slice(0, index + 1).join("/"),
      label: UUID_RE.test(segment) ? "" : (STATIC_LABELS[segment] ?? segment),
      dynamic: UUID_RE.test(segment),
    }))
  }, [pathname])

  // Resolve dynamic segment labels (e.g. project titles) once per path.
  useEffect(() => {
    let cancelled = false
    for (const crumb of crumbs) {
      if (!crumb.dynamic || dynamicLabels[crumb.href]) continue
      fetch(`/api/breadcrumb?path=${encodeURIComponent(crumb.href)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { label: string | null } | null) => {
          if (!cancelled && data?.label) {
            setDynamicLabels((prev) => ({ ...prev, [crumb.href]: data.label as string }))
          }
        })
        .catch(() => undefined)
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (crumbs.length === 0) return <span className="w-2" />

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1 text-[0.8125rem]">
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Link href="/dashboard" aria-label="Home" />}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="size-3.5" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const label =
            crumb.dynamic === true
              ? (dynamicLabels[crumb.href] ?? "…")
              : crumb.label
          return (
            <Fragment key={crumb.href}>
              <BreadcrumbSeparator className="[&>svg]:size-3" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="max-w-56 truncate font-medium sm:max-w-72">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={crumb.href} />}
                    className={cn(
                      "max-w-40 truncate text-muted-foreground transition-colors hover:text-foreground",
                      crumb.dynamic && "font-medium text-foreground/80"
                    )}
                  >
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
