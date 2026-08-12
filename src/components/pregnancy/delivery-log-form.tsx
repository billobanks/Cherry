"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import type { LogDeliveryInput, LogDeliveryResult } from "@/lib/pregnancy/delivery-actions";
import type { DeliveryType } from "@/types/database";

const DELIVERY_TYPE_OPTIONS: { value: DeliveryType; label: string }[] = [
  { value: "vaginal", label: "Vaginal" },
  { value: "cesarean", label: "Cesarean" },
  { value: "other", label: "Other" },
];

export function DeliveryLogForm({ onLogDelivery }: { onLogDelivery: (input: LogDeliveryInput) => Promise<LogDeliveryResult> }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<DeliveryType | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!date) {
      toast.error("Pick the delivery date first.");
      return;
    }
    startTransition(async () => {
      const result = await onLogDelivery({
        deliveryDate: date,
        deliveryTime: time || null,
        deliveryType: type,
        location: location || null,
        notes: notes || null,
      });
      if (result.status !== "ready") {
        toast.error("message" in result ? result.message : "Couldn't save your delivery record.");
        return;
      }
      toast.success("Delivery recorded. Congratulations.");
      router.push("/app/pregnancy");
    });
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-2xl border border-dashed border-border px-5 py-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        Had your baby? Log the delivery
      </button>
    );
  }

  const inputClass = "h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[15px] outline-none focus:border-primary";

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">Log delivery</h2>
      <div className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
        </div>
        <ChipSelect label="Delivery type" options={DELIVERY_TYPE_OPTIONS} multi={false} value={type} onChange={setType} />
        <input placeholder="Hospital / birth center" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary" />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-70"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save delivery record"}
        </button>
      </div>
    </section>
  );
}
