"use client"

import { DebugTools } from "@/components/debug-tools"

export default function DebugPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Debug Tools</h2>
      </div>

      <div className="space-y-4">
        <DebugTools />
      </div>
    </div>
  )
}

