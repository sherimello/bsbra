"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function LocaleError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container size="narrow" className="py-28 text-center sm:py-40">
      <p className="text-eyebrow text-fg-subtle">Error</p>
      <h1 className="text-headline mt-3">Something went wrong.</h1>
      <p className="mt-3 text-fg-subtle" lang="bn">
        কিছু একটা সমস্যা হয়েছে।
      </p>
      <p className="mx-auto mt-4 max-w-md text-fg-subtle">We couldn’t load this page. Please try again in a moment.</p>
      {error.digest && <p className="mt-2 font-mono text-[0.75rem] text-fg-faint">{error.digest}</p>}
      <Button size="lg" className="mt-10" onClick={() => retry()}>
        Try again · আবার চেষ্টা করুন
      </Button>
    </Container>
  );
}
