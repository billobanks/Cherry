"use client";

import { MailCheck } from "lucide-react";

export function ConfirmEmailStep({ email }: { email: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <MailCheck className="h-8 w-8 text-primary" />
        <h1 className="mt-4 font-heading text-[2rem] leading-[1.15] font-medium text-balance">
          Check your inbox
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
          Once you confirm, log in and we&apos;ll finish setting up your
          account with what you told us.
        </p>
      </div>
    </div>
  );
}
