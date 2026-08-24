import { describe, expect, it } from "vitest"

import { formatBytes, humanize } from "@/lib/format"

describe("format helpers", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB")
  })

  it("humanizes enum-style values", () => {
    expect(humanize("in_progress")).toBe("In Progress")
    expect(humanize("final_report")).toBe("Final Report")
    expect(humanize("draft")).toBe("Draft")
  })
})
