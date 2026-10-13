import Link from "next/link";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";
import { formatDate } from "@/lib/i18n/format";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/ui/app-image";

export function postHref(locale: Locale, post: Pick<Post, "slug" | "external_url" | "body_en" | "type">) {
  // Media coverage without our own body links straight to the source.
  if (post.external_url && !post.body_en) return post.external_url;
  return href(locale, `/news/${post.slug}`);
}

export function PostCard({
  post,
  locale,
  t,
  variant = "default",
  className,
}: {
  post: Post;
  locale: Locale;
  t: Dictionary;
  variant?: "default" | "feature" | "compact" | "row";
  className?: string;
}) {
  const link = postHref(locale, post);
  const external = /^https?:\/\//.test(link);
  const title = tr(post, "title", locale);
  const excerpt = tr(post, "excerpt", locale);
  const date = formatDate(locale, post.published_at, "long");
  const LinkTag = external ? "a" : Link;
  const linkProps = external ? { href: link, target: "_blank", rel: "noopener noreferrer" } : { href: link };

  if (variant === "compact") {
    return (
      <LinkTag {...linkProps} className={cn("group block border-t border-line py-5", className)}>
        <div className="mb-1.5 flex items-center gap-2 text-[0.75rem] text-fg-subtle">
          <span className="font-medium text-fg">{t.labels.postType[post.type]}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.published_at ?? undefined}>{date}</time>
          {post.source_name && (
            <>
              <span aria-hidden>·</span>
              <span>{post.source_name}</span>
            </>
          )}
        </div>
        <h3 className="flex items-start gap-1 text-[1.125rem] leading-snug font-semibold tracking-[-0.018em] text-fg group-hover:text-link">
          {title}
          {external && <ArrowUpRight className="mt-1 size-4 shrink-0 opacity-50" />}
        </h3>
      </LinkTag>
    );
  }

  if (variant === "row") {
    return (
      <article className={cn("group", className)}>
        <LinkTag {...linkProps} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-5">
          <div className="art-frame aspect-[4/3] rounded-2xl">
            <AppImage
              src={post.cover_image}
              alt=""
              seed={post.slug}
              sizes="(min-width: 1024px) 15vw, 40vw"
              className="transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
            />
          </div>
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-fg-subtle">
              <span className="font-medium text-fg">{t.labels.postType[post.type]}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.published_at ?? undefined}>{date}</time>
            </div>
            <h3 className="text-[1.125rem] leading-snug font-semibold tracking-[-0.018em] text-balance text-fg transition-colors group-hover:text-link">
              {title}
              {external && <ArrowUpRight className="ml-1 inline size-4 opacity-50" />}
            </h3>
            {excerpt && <p className="mt-1.5 line-clamp-2 text-[0.9375rem] text-fg-subtle">{excerpt}</p>}
          </div>
        </LinkTag>
      </article>
    );
  }

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <LinkTag {...linkProps} className="flex h-full flex-col">
        <div
          className={cn(
            "art-frame rounded-[var(--radius-card)]",
            variant === "feature" ? "aspect-[16/10]" : "aspect-[3/2]",
          )}
        >
          <AppImage
            src={post.cover_image}
            alt=""
            seed={post.slug}
            sizes={variant === "feature" ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 30vw, 100vw"}
            className="transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
          />
        </div>
        <div className="flex flex-1 flex-col pt-5">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-fg-subtle">
            <span className="font-medium text-fg">{t.labels.postType[post.type]}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.published_at ?? undefined}>{date}</time>
          </div>
          <h3
            className={cn(
              "font-semibold text-balance text-fg transition-colors group-hover:text-link",
              variant === "feature"
                ? "text-[1.75rem] leading-[1.12] tracking-[-0.025em] sm:text-[2rem]"
                : "text-[1.25rem] leading-snug tracking-[-0.02em]",
            )}
          >
            {title}
          </h3>
          {excerpt && (
            <p className={cn("mt-2.5 text-fg-subtle", variant === "feature" ? "text-[1.0625rem]" : "line-clamp-3 text-[0.9375rem]")}>
              {excerpt}
            </p>
          )}
          {post.event_date && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-fg-subtle">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDate(locale, post.event_date, "long")}
              </span>
              {post.event_location_en && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {tr(post, "event_location", locale)}
                </span>
              )}
            </div>
          )}
        </div>
      </LinkTag>
    </article>
  );
}
