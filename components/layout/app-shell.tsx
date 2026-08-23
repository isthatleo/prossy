"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { Bell, LogOut, Menu, Settings, SquareTerminal } from "lucide-react"
import { signOut } from "@/lib/auth/client"
import { getNavSections } from "@/lib/nav-config"
import type { UserRole } from "@/lib/rbac"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

export interface ShellUser {
  id: string
  name: string
  email: string
  image: string | null
  role: UserRole
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname()
  const sections = getNavSections(role)

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-2 pb-1.5 text-[0.6875rem] font-medium tracking-widest text-muted-foreground/70 uppercase">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function UserMenu({ user, compact = false }: { user: ShellUser; compact?: boolean }) {
  const roleBadge = (
    <Badge variant="secondary" className="capitalize">
      {user.role}
    </Badge>
  )

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
        {!compact ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-tight">
              {user.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side="top" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{user.name}</span>
          {roleBadge}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="size-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-2 pt-5 pb-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <SquareTerminal className="size-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">Prossy</span>
    </Link>
  )
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="glass-strong fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r lg:flex">
        <BrandMark />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav role={user.role} />
        </div>
        <div className="border-t border-border/60 p-3">
          <UserMenu user={user} />
        </div>
      </aside>

      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" />
          }
        >
          <Menu className="size-4" />
        </SheetTrigger>
        <SheetContent side="left" className="glass-strong w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <BrandMark />
          <SidebarNav role={user.role} />
          <div className="mt-auto border-t border-border/60 p-3">
            <UserMenu user={user} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-dvh flex-col lg:pl-60">
        {/* Topbar */}
        <header className="glass-strong sticky top-0 z-20 flex h-13 shrink-0 items-center gap-3 border-b px-4 md:px-6">
          <span className="lg:hidden" />
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/notifications"
                    aria-label="Notifications"
                    className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  />
                }
              >
                <Bell className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
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
