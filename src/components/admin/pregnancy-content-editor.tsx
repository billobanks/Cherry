"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminWeekContentRow, WeekContentUpdate } from "@/lib/pregnancy/admin-content-actions";
import type { ContentGovernanceStatus } from "@/types/database";

const STATUS_OPTIONS: { value: ContentGovernanceStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "MEDICAL_REVIEW", label: "Medical review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "RETIRED", label: "Retired" },
];

const STATUS_BADGE: Record<ContentGovernanceStatus, string> = {
  DRAFT: "bg-secondary text-muted-foreground",
  MEDICAL_REVIEW: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-accent text-accent-foreground",
  PUBLISHED: "bg-moss-soft text-moss",
  RETIRED: "bg-secondary text-muted-foreground",
};

export function PregnancyContentEditor({
  row,
  onSave,
}: {
  row: AdminWeekContentRow;
  onSave: (id: string, update: WeekContentUpdate) => Promise<{ success: boolean; message?: string }>;
}) {
  const [content, setContent] = useState(row.content);
  const [status, setStatus] = useState(row.status);
  const [source, setSource] = useState(row.source ?? "");
  const [sourceUrl, setSourceUrl] = useState(row.sourceUrl ?? "");
  const [medicalReviewer, setMedicalReviewer] = useState(row.medicalReviewer ?? "");
  const [dateReviewed, setDateReviewed] = useState(row.dateReviewed ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await onSave(row.id, {
        content,
        status,
        source: source || null,
        sourceUrl: sourceUrl || null,
        medicalReviewer: medicalReviewer || null,
        dateReviewed: dateReviewed || null,
      });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save.");
        return;
      }
      toast.success(`Week ${row.weekNumber} · ${row.section} saved.`);
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          Week {row.weekNumber} · {row.section.replace(/_/g, " ")}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}>{status}</span>
      </div>

      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="mt-3 rounded-2xl" />

      <div className="mt-4">
        <ChipSelect label="Status" options={STATUS_OPTIONS} multi={false} value={status} onChange={setStatus} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Source</span>
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. ACOG" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Source URL</span>
          <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Medical reviewer</span>
          <Input value={medicalReviewer} onChange={(e) => setMedicalReviewer(e.target.value)} placeholder="Name, credentials" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Date reviewed</span>
          <Input type="date" value={dateReviewed} onChange={(e) => setDateReviewed(e.target.value)} />
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">v{row.contentVersion}</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </button>
      </div>
    </section>
  );
}
