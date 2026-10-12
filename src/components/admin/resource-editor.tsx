"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { FieldConfig, Option } from "@/lib/admin/resources";
import { deleteRecord, saveRecord, saveSettings } from "@/lib/admin/actions";
import { ResourceForm } from "./resource-form";
import { ConfirmDialog } from "./confirm-dialog";

type Values = Record<string, unknown>;

/** Create / edit form for a configured resource. Redirects to the record after creation. */
export function ResourceEditor({
  resourceKey,
  id,
  fields,
  initial,
  relationOptions,
  canPublish,
  canEdit,
  folder,
}: {
  resourceKey: string;
  id: string | null;
  fields: FieldConfig[];
  initial: Values;
  relationOptions: Record<string, Option[]>;
  canPublish: boolean;
  canEdit: boolean;
  folder: string;
}) {
  const router = useRouter();
  return (
    <ResourceForm
      fields={fields}
      initial={initial}
      relationOptions={relationOptions}
      canPublish={canPublish}
      canEdit={canEdit}
      folder={folder}
      submitLabel={id ? "Save changes" : "Create"}
      onSubmit={(values) => saveRecord(resourceKey, id, values)}
      onSaved={(result) => {
        if (!id && result.id) router.replace(`/admin/${resourceKey}/${result.id}`);
      }}
    />
  );
}

export function SettingsEditor({ fields, initial, canEdit }: { fields: FieldConfig[]; initial: Values; canEdit: boolean }) {
  return (
    <ResourceForm
      fields={fields}
      initial={initial}
      relationOptions={{}}
      canEdit={canEdit}
      folder="settings"
      submitLabel="Save settings"
      onSubmit={(values) => saveSettings(values)}
    />
  );
}

export function DeleteRecordButton({ resourceKey, id, label }: { resourceKey: string; id: string; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await deleteRecord(resourceKey, id);
      if (result.ok) {
        toast.success("Deleted");
        router.replace(`/admin/${resourceKey}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not delete.");
        setOpen(false);
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] font-medium text-danger hairline hover:bg-danger-soft"
      >
        <Trash2 className="size-4" />
        Delete
      </button>
      <ConfirmDialog
        open={open}
        title={`Delete “${label}”?`}
        body="This can’t be undone. The deletion is recorded in the audit log."
        confirmLabel="Delete"
        busy={pending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
