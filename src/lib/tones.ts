import type { Tone } from "@/components/ui/badge";
import type { AccessLevel, ComplianceStatus, PublishStatus, VesselStatus, YardStatus } from "@/lib/types";

/** Badge tones for enumerated states, shared by the public site and admin. */
export const vesselStatusTone: Record<VesselStatus, Tone> = {
  anchored: "info",
  beached: "warn",
  cutting: "brand",
  completed: "neutral",
};

export const yardStatusTone: Record<YardStatus, Tone> = {
  green: "ok",
  progressive: "info",
  conventional: "neutral",
  inactive: "neutral",
};

export const complianceStatusTone: Record<ComplianceStatus, Tone> = {
  in_force: "ok",
  adopted: "info",
  in_progress: "warn",
  achieved: "ok",
  planned: "neutral",
};

export const publishStatusTone: Record<PublishStatus, Tone> = {
  draft: "neutral",
  review: "warn",
  published: "ok",
  archived: "neutral",
};

export const accessLevelTone: Record<AccessLevel, Tone> = {
  public: "neutral",
  corporate: "info",
  members: "brand",
  internal: "warn",
};
