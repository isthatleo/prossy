"use client"

import { useEffect } from "react"
import Link from "next/link"

import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

export default function ProjectDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="glass w-full max-w-md shadow-none">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Could not load project</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This project may not exist or you may not have access.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              <RefreshCcw className="size-4" />
              Try again
            </Button>
            <Button render={<Link href="/projects" />}>
              <ArrowLeft className="size-4" />
              All projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
