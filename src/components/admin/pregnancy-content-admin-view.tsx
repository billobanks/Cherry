import { PregnancyContentEditor } from "./pregnancy-content-editor";
import type { AdminWeekContentRow, WeekContentUpdate } from "@/lib/pregnancy/admin-content-actions";

export function PregnancyContentAdminView({
  rows,
  onSave,
}: {
  rows: AdminWeekContentRow[];
  onSave: (id: string, update: WeekContentUpdate) => Promise<{ success: boolean; message?: string }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Pregnancy week content</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Content only ever reaches users once its status is Published — every other status (including
          Approved) stays invisible in the app. Approving or publishing requires a medical reviewer on record.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <PregnancyContentEditor key={row.id} row={row} onSave={onSave} />
        ))}
      </div>
    </div>
  );
}
