import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Tags,
  Users,
} from "lucide-react"

import type { UserRole } from "@/lib/rbac"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export interface NavSection {
  label: string
  items: NavItem[]
}

const OVERVIEW_SECTION: NavSection = {
  label: "Overview",
  items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
}

const STUDENT_SECTIONS: NavSection[] = [
  {
    label: "Project",
    items: [
      { title: "My Project", href: "/projects", icon: FolderKanban },
      { title: "Resources", href: "/resources", icon: BookOpen },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { title: "Messages", href: "/messages", icon: MessagesSquare },
      { title: "Meetings", href: "/meetings", icon: CalendarDays },
    ],
  },
]

const SUPERVISOR_SECTIONS: NavSection[] = [
  {
    label: "Supervision",
    items: [
      { title: "Students", href: "/students", icon: GraduationCap },
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "Reviews", href: "/reviews", icon: Tags },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { title: "Messages", href: "/messages", icon: MessagesSquare },
      { title: "Meetings", href: "/meetings", icon: CalendarDays },
      { title: "Resources", href: "/resources", icon: BookOpen },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
]

const ADMIN_SECTIONS: NavSection[] = [
  {
    label: "People",
    items: [
      { title: "Students", href: "/students", icon: GraduationCap },
      { title: "Supervisors", href: "/supervisors", icon: Users },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "Departments", href: "/admin/departments", icon: Building2 },
      { title: "Categories", href: "/admin/categories", icon: Tags },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { title: "Messages", href: "/messages", icon: MessagesSquare },
      { title: "Meetings", href: "/meetings", icon: CalendarDays },
      { title: "Resources", href: "/resources", icon: BookOpen },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", href: "/reports", icon: BarChart3 },
    ],
  },
]

// Shared trailing sections for every role
const ACCOUNT_SECTION: NavSection = {
  label: "Account",
  items: [
    { title: "Notifications", href: "/notifications", icon: Bell },
    { title: "Settings", href: "/settings", icon: Settings },
  ],
}

export function getNavSections(role: UserRole): NavSection[] {
  const roleSections =
    role === "admin"
      ? ADMIN_SECTIONS
      : role === "supervisor"
        ? SUPERVISOR_SECTIONS
        : STUDENT_SECTIONS

  return [OVERVIEW_SECTION, ...roleSections, ACCOUNT_SECTION]
}
