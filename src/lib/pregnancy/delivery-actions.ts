"use server";

import { createClient } from "@/lib/supabase/server";
import type { DeliveryType } from "@/types/database";
import { calculatePregnancyDating } from "./dating-engine";
import { getActivePregnancy } from "./pregnancy-lookup";

export interface LogDeliveryInput {
  deliveryDate: string;
  deliveryTime: string | null;
  deliveryType: DeliveryType | null;
  location: string | null;
  notes: string | null;
}

export type LogDeliveryResult =
  | { status: "ready" }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

/**
 * A record the user logs themselves — never a clinical determination. This
 * is also the one place a pregnancy transitions PREGNANT -> DELIVERED,
 * which is what stops every "week X" / milestone surface from showing for
 * this pregnancy going forward (see dashboard-actions.ts's status branch).
 */
export async function logDelivery(input: LogDeliveryInput): Promise<LogDeliveryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  let gestationalAgeAtDeliveryDays: number | null = null;
  try {
    const dating = calculatePregnancyDating({
      lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
      clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
      ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
      userEnteredDueDate: pregnancy.estimatedDueDate,
      today: input.deliveryDate,
    });
    gestationalAgeAtDeliveryDays = dating.totalGestationalAgeDays;
  } catch {
    gestationalAgeAtDeliveryDays = null;
  }

  const { error: deliveryError } = await supabase.from("delivery_records").insert({
    pregnancy_id: pregnancy.id,
    user_id: user.id,
    delivery_date: input.deliveryDate,
    delivery_time: input.deliveryTime,
    delivery_type: input.deliveryType,
    location: input.location,
    notes: input.notes,
  });

  if (deliveryError) {
    return { status: "error", message: "Couldn't save your delivery record — please try again." };
  }

  const { error: statusError } = await supabase
    .from("pregnancies")
    .update({
      status: "DELIVERED",
      delivery_date: input.deliveryDate,
      gestational_age_at_delivery_days: gestationalAgeAtDeliveryDays,
    })
    .eq("id", pregnancy.id)
    .eq("user_id", user.id);

  if (statusError) {
    return { status: "error", message: "Your delivery was recorded, but we couldn't update your pregnancy status." };
  }

  return { status: "ready" };
}
