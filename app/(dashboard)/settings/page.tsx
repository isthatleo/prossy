import Link from "next/link"
import { Link2, Moon, UserRound } from "lucide-react"

import { ChangePasswordForm } from "@/components/settings/profile-forms"
import { ThemeSetting } from "@/components/settings/theme-setting"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireUser } from "@/lib/auth/guards"

export const metadata = { title: "Settings" }

export default async function SettingsPage() {
  const session = await requireUser()
  const user = session.user

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Preferences for your Prossy account."
      />

      <div className="mt-6 flex flex-col gap-4">
        <Card className="glass shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Moon className="size-4 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>
              Choose how Prossy looks on this device. The toggle in the topbar
              flips light and dark instantly.
            </CardDescription>
          </CardHeader>
          <Separator className="my-2" />
          <CardContent className="pt-5">
            <ThemeSetting />
          </CardContent>
        </Card>

        <Card className="glass shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Password</CardTitle>
            <CardDescription>
              Update the password you use to sign in.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Link href="/profile" className="block rounded-xl focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none">
          <Card
            className="glass tile-hover shadow-none"
          >
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <UserRound className="size-4" />
              </span>
              <div>
                <CardTitle className="text-sm">Profile</CardTitle>
                <CardDescription>
                  Signed in as{" "}
                  <span className="font-medium text-foreground">{user.email}</span>{" "}
                  — update your name, picture and view your details.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted-foreground/70">
          <Link2 className="size-3" /> More workspace settings arrive with the
          admin suite.
        </p>
      </div>
    </div>
  )
}
