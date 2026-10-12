"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile, type ProfileState } from "@/app/[locale]/portal/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Field = "full_name" | "organization" | "designation" | "phone";

export function ProfileForm({
  values,
  labels,
  className,
}: {
  values: Record<Field | "email", string>;
  labels: Record<Field | "email" | "save" | "saved" | "error", string>;
  className?: string;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, { status: "idle" });

  useEffect(() => {
    if (state.status === "success") toast.success(labels.saved);
    if (state.status === "error") toast.error(labels.error);
  }, [state, labels.saved, labels.error]);

  return (
    <form action={action} className={cn("grid gap-5 sm:grid-cols-2", className)}>
      <div className="sm:col-span-2">
        <Label htmlFor="pf-email">{labels.email}</Label>
        <Input id="pf-email" value={values.email} disabled readOnly />
      </div>
      {(["full_name", "organization", "designation", "phone"] as Field[]).map((field) => (
        <div key={field} className={field === "full_name" ? "sm:col-span-2" : undefined}>
          <Label htmlFor={`pf-${field}`}>{labels[field]}</Label>
          <Input
            id={`pf-${field}`}
            name={field}
            defaultValue={values[field]}
            required={field === "full_name"}
            type={field === "phone" ? "tel" : "text"}
          />
        </div>
      ))}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {labels.save}
        </Button>
      </div>
    </form>
  );
}
