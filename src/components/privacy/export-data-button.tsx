"use client";

import { Download, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ExportUserDataResult } from "@/lib/privacy";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportDataButton({ onExport }: { onExport: () => Promise<ExportUserDataResult> }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await onExport();
      if (result.status === "ready") {
        const dateStamp = result.exportedAt.slice(0, 10);
        downloadJson(result.data, `cherry-data-export-${dateStamp}.json`);
        toast.success("Your data export has downloaded.");
        return;
      }
      if (result.status === "signed_out") {
        toast.error("Please sign in again.");
        return;
      }
      if (result.status === "rate_limited") {
        toast.error("You've requested a few exports already — try again in a bit.");
        return;
      }
      toast.error(result.message);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-70"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Export my data
    </button>
  );
}
