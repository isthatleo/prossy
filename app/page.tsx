import Link from "next/link"
import {
  ArrowRight,
  Bell,
  CalendarDays,
  FolderKanban,
  HeartPulse,
  MessagesSquare,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Project lifecycle",
    description:
      "From topic registration to final submission with versioned proposals and documents.",
  },
  {
    icon: MessagesSquare,
    title: "Built-in messaging",
    description:
      "Students, supervisors and admins collaborate in one dashboard.",
  },
  {
    icon: CalendarDays,
    title: "Supervision meetings",
    description:
      "A historical record of every session, agenda and action item.",
  },
  {
    icon: Bell,
    title: "Smart notifications",
    description: "Event-driven alerts for reviews, deadlines and approvals.",
  },
  {
    icon: HeartPulse,
    title: "Project health",
    description:
      "Transparent scoring that surfaces at-risk projects early.",
  },
  {
    icon: Search,
    title: "Topic registry",
    description: "Search previous projects and detect duplicate titles.",
  },
]

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
      <header className="flex h-16 items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">Prossy</span>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button render={<Link href="/register" />}>Get started</Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <Badge variant="secondary" className="mb-6">
          Student Project Management, Supervision & Collaboration
        </Badge>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          The entire student project lifecycle,{" "}
          <span className="text-primary">in one platform</span>
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground">
          Prossy connects students, supervisors and administrators — proposals,
          submissions, meetings, messaging, notifications and analytics working
          as one coherent system.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button size="lg" render={<Link href="/register" />}>
            Create an account
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>

        <div className="mt-20 grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="glass tile-hover shadow-none">
              <CardContent className="p-5">
                <feature.icon className="size-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="flex h-14 items-center justify-center text-xs text-muted-foreground">
        Prossy — Final Year Project Platform
      </footer>
    </div>
  )
}
