import { z } from "zod";
import { CYCLE_LENGTH_RANGE, PERIOD_LENGTH_RANGE } from "./constants";

const FOCUS_VALUES = [
  "track_cycle",
  "understand_symptoms",
  "energy_sleep_mood",
  "fertility_awareness",
  "exploring",
] as const;

const REGULARITY_VALUES = [
  "regular",
  "somewhat_irregular",
  "irregular",
  "not_sure",
] as const;

const GOAL_VALUES = [
  "understand_cycle",
  "predict_period",
  "understand_pms",
  "improve_energy",
  "improve_sleep",
  "understand_mood",
  "nutrition_guidance",
  "exercise_guidance",
  "track_symptoms",
  "fertility_awareness",
] as const;

const FLOW_VALUES = ["spotting", "light", "medium", "heavy"] as const;

const NOTIFICATION_CATEGORY_VALUES = [
  "daily_checkin_reminder",
  "period_prediction",
  "insight_digest",
  "product_updates",
] as const;

/** yyyy-mm-dd, not in the future, not more than ~2 years ago (older than that isn't useful for estimation). */
export const lastPeriodStartDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker to choose a date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime());
  }, "That doesn't look like a valid date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    return date.getTime() <= Date.now();
  }, "That date is in the future — pick the day your last period started.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return date.getTime() >= twoYearsAgo.getTime();
  }, "That's a while ago — we'll just use your typical cycle length instead.");

export const stepSchemas = {
  focus: z.object({
    primaryFocus: z.enum(FOCUS_VALUES).nullable(),
  }),

  lastPeriod: z.object({
    lastPeriodStartDate: z
      .union([lastPeriodStartDateSchema, z.null()])
      .default(null),
    lastPeriodFlowIntensity: z.enum(FLOW_VALUES).nullable().default(null),
  }),

  cycleLength: z.object({
    avgCycleLengthDays: z
      .number()
      .int()
      .min(CYCLE_LENGTH_RANGE.min, `Cycle length should be at least ${CYCLE_LENGTH_RANGE.min} days.`)
      .max(CYCLE_LENGTH_RANGE.max, `Cycle length should be ${CYCLE_LENGTH_RANGE.max} days or fewer.`)
      .nullable(),
  }),

  periodDuration: z.object({
    avgPeriodLengthDays: z
      .number()
      .int()
      .min(PERIOD_LENGTH_RANGE.min, `Period length should be at least ${PERIOD_LENGTH_RANGE.min} day.`)
      .max(PERIOD_LENGTH_RANGE.max, `Period length should be ${PERIOD_LENGTH_RANGE.max} days or fewer.`)
      .nullable(),
  }),

  regularity: z.object({
    cycleRegularity: z.enum(REGULARITY_VALUES).nullable(),
  }),

  symptoms: z.object({
    commonSymptomKeys: z.array(z.string()).max(30),
  }),

  goals: z.object({
    goals: z.array(z.enum(GOAL_VALUES)).max(GOAL_VALUES.length),
  }),

  notifications: z.object({
    notificationPreferences: z.record(
      z.enum(NOTIFICATION_CATEGORY_VALUES),
      z.boolean(),
    ),
  }),
};

export const accountSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1)
      .max(60, "Keep it under 60 characters.")
      .nullable()
      .default(null),
    email: z.email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "Keep it under 72 characters.")
      .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
        message: "Mix letters and numbers for a stronger password.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type AccountFormValues = z.infer<typeof accountSchema>;
