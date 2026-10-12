"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { submitContact, type ContactState } from "@/app/[locale]/contact/actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { spring } from "@/components/motion/springs";

export interface ContactLabels {
  name: string;
  email: string;
  phone: string;
  organization: string;
  subject: string;
  message: string;
  send: string;
  sending: string;
  success: string;
  error: string;
  previewError: string;
  privacy: string;
  validation: { name: string; email: string; message: string };
}

export function ContactForm({ locale, labels }: { locale: "en" | "bn"; labels: ContactLabels }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, { status: "idle" });
  // Records when the form became interactive (bot filter); set after hydration to avoid a mismatch.
  const startedRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  const fe = state.fieldErrors ?? {};

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state.status === "success" ? (
        <m.div
          key="done"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring.ui}
          role="status"
          className="flex flex-col items-center rounded-[var(--radius-tile)] bg-ok-soft px-6 py-16 text-center"
        >
          <CheckCircle2 className="size-10 text-ok" strokeWidth={1.6} />
          <p className="mt-4 max-w-sm text-[1.0625rem] font-medium text-fg">{labels.success}</p>
        </m.div>
      ) : (
        <m.form key="form" action={action} exit={{ opacity: 0 }} className="grid gap-5 sm:grid-cols-2" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <input ref={startedRef} type="hidden" name="started_at" defaultValue="0" />
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div>
            <Label htmlFor="c-name">{labels.name}</Label>
            <Input id="c-name" name="name" autoComplete="name" required aria-invalid={fe.name ? true : undefined} />
            <FieldError>{fe.name && labels.validation.name}</FieldError>
          </div>
          <div>
            <Label htmlFor="c-email">{labels.email}</Label>
            <Input id="c-email" name="email" type="email" autoComplete="email" required aria-invalid={fe.email ? true : undefined} />
            <FieldError>{fe.email && labels.validation.email}</FieldError>
          </div>
          <div>
            <Label htmlFor="c-phone">{labels.phone}</Label>
            <Input id="c-phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div>
            <Label htmlFor="c-org">{labels.organization}</Label>
            <Input id="c-org" name="organization" autoComplete="organization" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="c-subject">{labels.subject}</Label>
            <Input id="c-subject" name="subject" maxLength={200} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="c-message">{labels.message}</Label>
            <Textarea id="c-message" name="message" rows={6} required maxLength={5000} aria-invalid={fe.message ? true : undefined} />
            <FieldError>{fe.message && labels.validation.message}</FieldError>
          </div>
          {state.status === "error" && !state.fieldErrors && (
            <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[0.875rem] text-danger sm:col-span-2">
              {state.message === "preview" ? labels.previewError : labels.error}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.8125rem] text-fg-subtle">{labels.privacy}</p>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? labels.sending : labels.send}
            </Button>
          </div>
        </m.form>
      )}
    </AnimatePresence>
  );
}
