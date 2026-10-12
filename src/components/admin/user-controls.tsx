"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import type { Role } from "@/lib/types";
import { inviteUser, setUserActive, setUserRole } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Switch } from "./switch";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Controlling Authority",
  admin: "Administrator",
  editor: "Editor",
  data_entry: "Data entry",
  committee: "Executive Committee",
  member: "Member",
  corporate: "Corporate",
  guest: "Pending approval",
};

export function UserRoleControls({
  userId,
  role,
  active,
  assignable,
  locked,
}: {
  userId: string;
  role: Role;
  active: boolean;
  assignable: Role[];
  locked: boolean;
}) {
  const [currentRole, setCurrentRole] = useState(role);
  const [isActive, setIsActive] = useState(active);
  const [pending, startTransition] = useTransition();

  const changeRole = (next: Role) => {
    const previous = currentRole;
    setCurrentRole(next);
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if (result.ok) toast.success(`Role changed to ${ROLE_LABELS[next]}`);
      else {
        setCurrentRole(previous);
        toast.error(result.error ?? "Could not change role.");
      }
    });
  };

  const toggle = (next: boolean) => {
    setIsActive(next);
    startTransition(async () => {
      const result = await setUserActive(userId, next);
      if (result.ok) toast.success(next ? "Account activated" : "Account deactivated");
      else {
        setIsActive(!next);
        toast.error(result.error ?? "Could not update account.");
      }
    });
  };

  const options = assignable.includes(currentRole) ? assignable : [currentRole, ...assignable];

  return (
    <div className="flex items-center gap-4">
      <div className="w-52">
        <Select
          aria-label="Role"
          value={currentRole}
          disabled={locked || pending}
          onChange={(e) => changeRole(e.target.value as Role)}
          className="h-9 text-[0.8125rem]"
        >
          {options.map((r) => (
            <option key={r} value={r} disabled={!assignable.includes(r)}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>
      <Switch label="Active" checked={isActive} onChange={toggle} disabled={locked || pending} />
    </div>
  );
}

export function InviteUser({ assignable }: { assignable: Role[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ email: "", full_name: "", organization: "", role: "member" as Role });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteUser(form);
      if (result.ok) {
        toast.success(`Invitation sent to ${form.email}`);
        setForm({ email: "", full_name: "", organization: "", role: "member" });
        setOpen(false);
      } else toast.error(result.error ?? "Could not send invitation.");
    });
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <UserPlus />
        Invite user
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="mb-6 w-full rounded-[var(--radius-card)] bg-surface p-6 hairline">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[1.0625rem] font-semibold">Invite a user</h2>
        <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-bg-muted" aria-label="Close">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label htmlFor="inv-name">Full name</Label>
          <Input id="inv-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="inv-email">Email</Label>
          <Input id="inv-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="inv-org">Organisation</Label>
          <Input id="inv-org" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="inv-role">Role</Label>
          <Select id="inv-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {assignable.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-[0.8125rem] text-fg-subtle">The user receives an email to set their password. Their role applies immediately.</p>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send invitation"}
        </Button>
      </div>
    </form>
  );
}
