"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { accountSchema } from "@/lib/onboarding/schema";
import { StepShell } from "../step-shell";

interface AccountStepProps {
  stepIndex: number;
  displayName: string;
  email: string;
  onChangeDisplayName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  isGoogleLoading: boolean;
  serverError: { message: string; field?: "email" | "password" } | null;
  onSubmit: (password: string) => void;
  onGoogleSignIn: () => void;
}

type FieldErrors = Partial<
  Record<"displayName" | "email" | "password" | "confirmPassword", string>
>;

export function AccountStep({
  stepIndex,
  displayName,
  email,
  onChangeDisplayName,
  onChangeEmail,
  onBack,
  isSubmitting,
  isGoogleLoading,
  serverError,
  onSubmit,
  onGoogleSignIn,
}: AccountStepProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit() {
    const result = accountSchema.safeParse({
      displayName: displayName || null,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(password);
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  const busy = isSubmitting || isGoogleLoading;

  return (
    <StepShell
      stepIndex={stepIndex}
      eyebrow="Almost there"
      title="Create your account"
      description="This is what keeps your data private and synced to you."
      onBack={onBack}
      primaryLabel="Create account"
      onPrimary={handleSubmit}
      primaryLoading={isSubmitting}
      primaryDisabled={busy}
      errorMessage={!serverError?.field ? serverError?.message ?? null : null}
    >
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={busy}
          onClick={onGoogleSignIn}
          className="h-12 w-full justify-center gap-2.5 rounded-full text-[15px] font-medium"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleGlyph />
          )}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          or with email
          <Separator className="flex-1" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">
            First name <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="displayName"
            value={displayName}
            disabled={busy}
            onChange={(e) => onChangeDisplayName(e.target.value)}
            placeholder="What should we call you?"
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={busy}
            onChange={(e) => {
              clearFieldError("email");
              onChangeEmail(e.target.value);
            }}
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email || serverError?.field === "email")}
            className="h-12 rounded-2xl"
          />
          {fieldErrors.email || serverError?.field === "email" ? (
            <p className="text-sm text-destructive">
              {fieldErrors.email ?? serverError?.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              disabled={busy}
              onChange={(e) => {
                clearFieldError("password");
                setPassword(e.target.value);
              }}
              placeholder="At least 8 characters"
              aria-invalid={Boolean(fieldErrors.password)}
              className="h-12 rounded-2xl pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            disabled={busy}
            onChange={(e) => {
              clearFieldError("confirmPassword");
              setConfirmPassword(e.target.value);
            }}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            className="h-12 rounded-2xl"
          />
          {fieldErrors.confirmPassword ? (
            <p className="text-sm text-destructive">
              {fieldErrors.confirmPassword}
            </p>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to Cherry&apos;s Terms and Privacy Policy.
          We&apos;ll never post on your behalf or share your cycle data with
          advertisers.
        </p>
      </div>
    </StepShell>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.68-3.87 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}
