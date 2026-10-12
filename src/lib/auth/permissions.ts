import type { AccessLevel, Role } from "@/lib/types";

/**
 * Application-side mirror of the permission matrix enforced by Row Level
 * Security (supabase/migrations/…_security.sql). The database is the source
 * of truth; these helpers only decide what the UI offers.
 */

export const ROLES: Role[] = [
  "super_admin",
  "admin",
  "editor",
  "data_entry",
  "committee",
  "member",
  "corporate",
  "guest",
];

export const STAFF_ROLES: Role[] = ["super_admin", "admin", "editor", "data_entry"];
export const EDITOR_ROLES: Role[] = ["super_admin", "admin", "editor"];
export const ADMIN_ROLES: Role[] = ["super_admin", "admin"];

export const ACCESS_LEVELS: AccessLevel[] = ["public", "corporate", "members", "internal"];

export function isStaff(role: Role | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function isEditor(role: Role | null | undefined): boolean {
  return !!role && EDITOR_ROLES.includes(role);
}

export function isAdmin(role: Role | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isSuperAdmin(role: Role | null | undefined): boolean {
  return role === "super_admin";
}

/** Mirrors public.role_can_view(level, role). */
export function canView(level: AccessLevel, role: Role | null | undefined): boolean {
  switch (level) {
    case "public":
      return true;
    case "corporate":
      return !!role && role !== "guest";
    case "members":
      return !!role && !["guest", "corporate"].includes(role);
    case "internal":
      return !!role && [...STAFF_ROLES, "committee"].includes(role);
  }
}

/** Roles that an actor may assign to other users. */
export function assignableRoles(actor: Role | null | undefined): Role[] {
  if (actor === "super_admin") return ROLES;
  if (actor === "admin") return ROLES.filter((r) => r !== "super_admin" && r !== "admin");
  return [];
}

/** Whether an actor may change another user's role/status at all. */
export function canManageUser(actor: Role | null | undefined, target: Role): boolean {
  if (actor === "super_admin") return true;
  if (actor === "admin") return target !== "super_admin" && target !== "admin";
  return false;
}

export type Capability = "view" | "create" | "edit" | "publish" | "delete";
export type PermissionGroup = "content" | "data" | "minutes" | "members" | "messages" | "settings";

/** Mirrors the insert/update/delete policies for each group of tables. */
export function can(role: Role | null | undefined, capability: Capability, group: PermissionGroup): boolean {
  if (!role) return false;
  switch (group) {
    case "content":
    case "data":
      if (capability === "view" || capability === "create" || capability === "edit") return isStaff(role);
      return isEditor(role);
    case "members":
      if (capability === "delete") return isAdmin(role);
      return isStaff(role);
    case "minutes":
    case "settings":
      return isAdmin(role);
    case "messages":
      if (capability === "delete") return isAdmin(role);
      return isEditor(role);
  }
}

/** Landing page after sign-in for each role. */
export function homeForRole(role: Role): "admin" | "portal" {
  return isStaff(role) ? "admin" : "portal";
}
