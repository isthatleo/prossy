import Link from "next/link"
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Project lifecycle",
    description:
      "From topic registration to final submission — versioned proposals, documents and approvals in one pipeline.",
  },
  {
    icon: MessagesSquare,
    title: "Built-in messaging",
    description:
      "Students, supervisors and administrators collaborate in threaded conversations tied to each project.",
  },
  {
    icon: CalendarDays,
    title: "Supervision meetings",
    description:
      "Schedule sessions, capture agendas and keep a historical record of every supervision meeting.",
  },
  {
    icon: Bell,
    title: "Smart notifications",
    description:
      "Event-driven alerts for reviews, deadlines, feedback and approvals — nothing slips through.",
  },
  {
    icon: HeartPulse,
    title: "Project health",
    description:
      "Transparent scoring that surfaces at-risk projects early, before deadlines become disasters.",
  },
  {
    icon: Search,
    title: "Topic registry",
    description:
      "Search previous projects across departments and detect duplicate titles before they happen.",
  },
]

const ROLES = [
  {
    icon: GraduationCap,
    label: "Students",
    tagline: "Stay on track",
    points: [
      "Submit proposals and chapter documents for review",
      "Track milestones, deadlines and supervisor feedback",
      "Chat with your supervisor and teammates in one place",
    ],
  },
  {
    icon: ClipboardCheck,
    label: "Supervisors",
    tagline: "Mentor efficiently",
    points: [
      "Review submissions with structured approve/request-changes flows",
      "Monitor every assigned student's progress and health score",
      "Schedule meetings and record outcomes automatically",
    ],
  },
  {
    icon: ShieldCheck,
    label: "Administrators",
    tagline: "See everything",
    points: [
      "Oversee all projects, departments and category taxonomy",
      "Assign supervisors and manage user accounts",
      "Institution-wide analytics and audit-ready activity logs",
    ],
  },
]

const WORKFLOW = [
  { icon: FileText, step: "01", title: "Register topic", description: "Student submits a proposal against the department registry." },
  { icon: ClipboardCheck, step: "02", title: "Get approved", description: "Supervisor reviews, comments and approves the proposal." },
  { icon: FolderKanban, step: "03", title: "Build & submit", description: "Chapters are submitted version-by-version with tracked feedback." },
  { icon: CheckCircle2, step: "04", title: "Final review", description: "Complete submission is graded and archived in the registry." },
]

export default function Home() {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Prossy</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#roles" className="transition-colors hover:text-foreground">
              Roles
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              Workflow
            </a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button render={<Link href="/register" />}>Get started</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
        {/* Hero */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5 text-primary" />
            Student Project Management, Supervision & Collaboration
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.1]">
            The entire student project lifecycle,{" "}
            <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
              in one platform
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Prossy connects students, supervisors and administrators —
            proposals, submissions, meetings, messaging, notifications and
            analytics working as one coherent system.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" className="h-11 px-6 text-[0.95rem]" render={<Link href="/register" />}>
              Create an account
              <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6 text-[0.95rem]" render={<Link href="/login" />}>
              Sign in to your dashboard
            </Button>
          </div>

          {/* Stats strip */}
          <div className="glass mt-16 grid w-full max-w-3xl grid-cols-2 gap-y-6 rounded-2xl p-6 sm:grid-cols-4">
            {[
              ["21+", "Modules"],
              ["3", "Roles"],
              ["100%", "Audit trail"],
              ["0", "Missed deadlines*"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-semibold tracking-tight text-primary">{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[0.6875rem] text-muted-foreground/60">
            *when you actually use it
          </p>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-14">
          <div className="mb-10 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-3">Everything you need</Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              One system, zero spreadsheets
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Replace scattered email threads, WhatsApp groups and USB drives
              with a single source of truth for every project.
            </p>
          </div>
          <div className="grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="glass tile-hover shadow-none">
                <CardContent className="p-5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-4.5" />
                  </div>
                  <h3 className="mt-3.5 text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-20 py-14">
          <div className="mb-10 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-3">Made for three roles</Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Built around how your institution works
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {ROLES.map((role) => (
              <Card key={role.label} className="glass tile-hover shadow-none">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <role.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold leading-tight">{role.label}</h3>
                      <p className="text-xs text-muted-foreground">{role.tagline}</p>
                    </div>
                  </div>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-chart-2" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="scroll-mt-20 py-14">
          <div className="mb-10 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-3">From idea to archive</Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              A workflow that mirrors real supervision
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((item) => (
              <Card key={item.step} className="glass tile-hover relative overflow-hidden shadow-none">
                <CardContent className="p-5">
                  <span className="absolute -top-2 right-3 text-5xl font-bold tracking-tighter text-foreground/[0.05]">
                    {item.step}
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="size-4.5" />
                  </div>
                  <h3 className="mt-3.5 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 pb-24">
          <Card className="glass-strong relative overflow-hidden border-primary/25 shadow-none">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-chart-2/10"
            />
            <CardContent className="relative flex flex-col items-center gap-5 py-14 text-center">
              <Users className="size-8 text-primary" />
              <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
                Ready to run your final year project properly?
              </h2>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Join your department on Prossy — set up takes less than a
                minute.
              </p>
              <Button size="lg" className="h-11 px-6" render={<Link href="/register" />}>
                Get started free
                <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6">
          <span>Prossy — Final Year Project Platform</span>
          <Separator orientation="vertical" className="hidden sm:block" />
          <span>© {new Date().getFullYear()} · Built for diploma students</span>
        </div>
      </footer>
    </div>
  )
}
