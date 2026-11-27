import { ArrowRight } from "lucide-react";
import type { HomepageBlock } from "@/lib/settings";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { StoreImage } from "@/components/common/store-image";
import { cn } from "@/lib/cn";

type Content = Extract<HomepageBlock, { type: "PROMO_BANNER" }>["content"];

const themes = {
  primary: "bg-primary text-primary-fg",
  secondary: "bg-secondary text-secondary-fg",
  surface: "bg-surface text-text",
};

export function PromoBanner({ content }: { content: Content }) {
  return (
    <section aria-label={content.title} className="py-6 sm:py-8">
      <Container>
        <div
          className={cn(
            "rounded-brand relative grid items-center gap-6 overflow-hidden p-6 sm:p-10 md:grid-cols-2",
            themes[content.theme],
          )}
        >
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">{content.title}</h2>
            {content.description && <p className="mt-2 max-w-md opacity-80">{content.description}</p>}
            {content.cta && (
              <ButtonLink
                href={content.cta.href}
                variant={content.theme === "primary" ? "secondary" : "primary"}
                className="mt-5 rounded-full"
              >
                {content.cta.label} <ArrowRight aria-hidden className="h-4 w-4" />
              </ButtonLink>
            )}
          </div>
          {content.imageUrl && (
            <div className="relative aspect-[16/9] w-full">
              <StoreImage
                src={content.imageUrl}
                alt=""
                sizes="(min-width: 768px) 45vw, 100vw"
                className="bg-transparent"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
