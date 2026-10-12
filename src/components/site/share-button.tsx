"use client";

import { Share } from "lucide-react";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/button";

/** Native share sheet where available (mobile), otherwise copies the link. */
export function ShareButton({ url, title, labels }: { url: string; title: string; labels: { share: string; copied: string } }) {
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        // Dismissed — fall through to copy only if sharing is unsupported.
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success(labels.copied);
  };

  return (
    <button type="button" onClick={share} className={buttonClass("ghost", "md", "hairline")}>
      <Share />
      {labels.share}
    </button>
  );
}
