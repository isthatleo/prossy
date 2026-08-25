"use client"

import { useSyncExternalStore, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CircleUserRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  SquareTerminal,
} from "lucide-react"

import { signOutAction } from "@/app/(dashboard)/notifications/actions"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { NotificationBell } from "@/components/layout/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getNavSections } from "@/lib/nav-config"
import type { UserRole } from "@/lib/rbac"
import type { NotificationItem } from "@/services/notifications"
import { cn, initials } from "@/lib/utils"

export interface ShellUser {
  id: string
  name: string
  email: string
  image: string | null
  role: UserRole
}

const SIDEBAR_KEY = "prossy.sidebar.collapsed"

/* Hydration-safe collapsed state backed by localStorage (no effect setState). */
const sidebarListeners = new Set<() => void>()

const sidebarStore = {
  subscribe(listener: () => void) {
    sidebarListeners.add(listener)
    return () => {
      sidebarListeners.delete(listener)
    }
  },
  getClientSnapshot() {
    return window.localStorage.getItem(SIDEBAR_KEY) === "1"
  },
  getServerSnapshot() {
    return false
  },
  toggle() {
    const next = !(window.localStorage.getItem(SIDEBAR_KEY) === "1")
    window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0")
    for (const listener of sidebarListeners) listener()
  },
}

function SidebarNav({
  role,
  collapsed,
  onNavigate,
}: {
  role: UserRole
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const sections = getNavSections(role)

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {sections.map((section) => (
        <div key={section.label}>
          {!collapsed ? (
            <p className="px-2 pb-1.5 text-[0.6875rem] font-medium tracking-widest text-muted-foreground/70 uppercase">
              {section.label}
            </p>
          ) : (
            <div className="mx-auto mb-2 h-px w-6 bg-border/70" aria-hidden />
          )}
          <ul className={cn("flex flex-col", collapsed ? "items-center gap-1" : "gap-0.5")}>
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`))
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center rounded-lg text-[0.8125rem] font-medium transition-colors",
                    collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed ? item.title : null}
                </Link>
              )
              return (
                <li key={item.href} className={collapsed ? "w-full" : undefined}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger render={<span className="block w-full">{link}</span>} />
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center pt-5 pb-3",
        collapsed ? "justify-center px-2" : "gap-2 px-4"
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <SquareTerminal className="size-4" />
      </span>
      {!collapsed ? (
        <span className="text-base font-semibold tracking-tight">Prossy</span>
      ) : null}
    </Link>
  )
}

function AccountSection({
  user,
  collapsed = false,
}: {
  user: ShellUser
  collapsed?: boolean
}) {
  if (collapsed) {
    return (
      <div className="flex justify-center border-t border-border/60 py-3">
        <UserMenu user={user} compact />
      </div>
    )
  }
  return (
    <div className="border-t border-border/60 p-3">
      <UserMenu user={user} />
    </div>
  )
}

function UserMenu({ user, compact = false }: { user: ShellUser; compact?: boolean }) {
  const [pending, startTransition] = useTransition()

  function onSignOut() {
    startTransition(async () => {
      try {
        await signOutAction()
      } catch {
        // Server action redirects after sign-out; nothing to handle here.
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-muted",
              compact && "w-auto"
            )}
          />
        }
      >
        <Avatar className="size-7">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className={cn("min-w-0", compact && "hidden sm:block")}>
          <span className="block truncate text-sm font-medium leading-tight">
            {user.name}
          </span>
          <span className="block truncate text-xs capitalize leading-tight text-muted-foreground">
            {user.role}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2.5 normal-case">
            <Avatar className="size-8">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuItem render={<Link href="/profile" />}>
            <CircleUserRound className="size-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings className="size-4" /> Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onClick={onSignOut} variant="destructive">
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/60 text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
    >
      {collapsed ? (
        <PanelLeftOpen className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
    </button>
  )
}

function MobileNavSheet({
  user,
  children,
}: {
  user: ShellUser
  children: React.ReactElement
}) {
  return (
    <Sheet>
      <SheetTrigger render={children} />
      <SheetContent side="left" className="glass-strong flex w-72 flex-col p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <BrandMark />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav role={user.role} collapsed={false} />
        </div>
        <AccountSection user={user} />
      </SheetContent>
    </Sheet>
  )
}

export function AppShell({
  user,
  notifications,
  children,
}: {
  user: ShellUser
  notifications: { items: NotificationItem[]; unreadCount: number }
  children: React.ReactNode
}) {
  const collapsed = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getClientSnapshot,
    sidebarStore.getServerSnapshot
  )

  function toggleCollapsed() {
    sidebarStore.toggle()
  }

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        data-collapsed={collapsed}
        className="glass-strong fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r transition-[width] duration-200 ease-out data-[collapsed=true]:w-[4.25rem] lg:flex"
      >
        <div
          className={cn(
            "flex w-full items-center",
            collapsed ? "flex-col gap-1.5" : "justify-between pr-3"
          )}
        >
          <BrandMark collapsed={collapsed} />
          <CollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav role={user.role} collapsed={collapsed} />
        </div>
        <AccountSection user={user} collapsed={collapsed} />
      </aside>

      <div
        data-collapsed={collapsed}
        className="flex min-h-dvh flex-col transition-[padding] duration-200 ease-out data-[collapsed=true]:lg:pl-[4.25rem] lg:pl-60"
      >
        {/* Topbar */}
        <header className="glass-strong sticky top-0 z-20 flex h-13 shrink-0 items-center gap-2 border-b px-3 md:px-4">
          <MobileNavSheet user={user}>
            <button
              type="button"
              aria-label="Open navigation"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="size-4" />
            </button>
          </MobileNavSheet>
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell
              initialItems={notifications.items}
              initialUnreadCount={notifications.unreadCount}
            />
            <UserMenu user={user} compact />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
