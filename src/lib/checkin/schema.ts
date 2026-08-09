import { z } from "zod";
import { NOTES_MAX_LENGTH } from "./constants";

const FLOW_VALUES = ["none", "spotting", "light", "medium", "heavy"] as const;
const MOOD_VALUES = [
  "happy",
  "calm",
  "anxious",
  "irritable",
  "sad",
  "emotional",
  "stressed",
] as const;
const DISCHARGE_VALUES = [
  "none",
  "spotting",
  "sticky",
  "creamy",
  "watery",
  "egg_white",
  "unusual",
] as const;
const EXERCISE_VALUES = ["none", "light", "moderate", "intense"] as const;

const checkinDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime());
  }, "Invalid date.")
  .refine((value) => {
    const today = new Date();
    const todayISO = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
    return value <= todayISO;
  }, "Can't log a check-in for a future date.");

export const checkinFormSchema = z.object({
  checkinDate: checkinDateSchema,
  flow: z.enum(FLOW_VALUES).nullable(),
  mood: z.array(z.enum(MOOD_VALUES)).max(MOOD_VALUES.length),
  energyLevel: z.number().int().min(1).max(5).nullable(),
  sleepQuality: z.number().int().min(1).max(5).nullable(),
  symptomKeys: z.array(z.string()).max(30),
  discharge: z.enum(DISCHARGE_VALUES).nullable(),
  exercise: z.enum(EXERCISE_VALUES).nullable(),
  libido: z.number().int().min(1).max(5).nullable(),
  notes: z.string().max(NOTES_MAX_LENGTH, "Keep notes under 2000 characters."),
});

export type CheckinFormSchema = z.infer<typeof checkinFormSchema>;
