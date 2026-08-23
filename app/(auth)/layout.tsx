import Link from "next/link"
import { SquareTerminal } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="glass-strong relative hidden flex-col justify-between overflow-hidden border-r p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <SquareTerminal className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Prossy</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Manage student projects from topic to defense.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Proposals, submissions, supervision meetings, messaging,
            notifications and progress analytics — one coherent platform for
            students, supervisors and administrators.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Student Project Management, Supervision & Collaboration System
        </p>

        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-primary/20 blur-3xl"
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        {children}
      </div>
    </div>
  )
}
