import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClass } from "@/components/ui/button";

// Rendered inside the localized layout. Locale isn't available here, so the
// copy is bilingual and links to the language-neutral root.
export default function NotFound() {
  return (
    <Container size="narrow" className="py-28 text-center sm:py-40">
      <p className="text-eyebrow text-fg-subtle">404</p>
      <h1 className="text-headline mt-3">This page has sailed.</h1>
      <p className="text-lede mt-4 text-fg-subtle" lang="bn">
        এই পৃষ্ঠাটি নোঙর তুলেছে।
      </p>
      <p className="mx-auto mt-4 max-w-md text-fg-subtle">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" className={buttonClass("primary", "lg", "mt-10")}>
        Return home · প্রথম পাতা
      </Link>
    </Container>
  );
}
