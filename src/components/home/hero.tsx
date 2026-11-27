import { ArrowRight } from "lucide-react";
import type { HomepageBlock } from "@/lib/settings";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { StoreImage } from "@/components/common/store-image";
import { HeroSlides } from "./hero-slides";

type HeroContent = Extract<HomepageBlock, { type: "HERO" }>["content"];

export function Hero({ content }: { content: HeroContent }) {
  return (
    <section aria-label="Featured promotion" className="pt-4 sm:pt-6">
      <Container>
        <div className="rounded-brand bg-surface relative overflow-hidden">
          {/* Decorative brand accents, echoing the reference design. */}
          <div
            aria-hidden
            className="bg-primary absolute inset-y-0 right-0 hidden w-[38%] [clip-path:polygon(30%_0,100%_0,100%_100%,0_100%)] md:block"
          />
          <div
            aria-hidden
            className="bg-secondary absolute right-0 bottom-0 hidden h-1/2 w-[22%] [clip-path:polygon(100%_0,100%_100%,0_100%)] md:block"
          />

          <div className="relative grid items-center gap-6 px-6 py-10 sm:px-10 md:grid-cols-[1fr_1.1fr] md:py-12 lg:px-16 lg:py-16">
            <div className="max-w-xl">
              {content.eyebrow && (
                <p className="text-text mb-3 flex items-center gap-3 text-xs font-bold tracking-widest uppercase sm:text-sm">
                  {content.eyebrow}
                  <span aria-hidden className="bg-primary h-[3px] w-10" />
                </p>
              )}
              <h1 className="text-text text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                {content.headline}
                {content.highlight && (
                  <>
                    <br />
                    <span className="text-primary [text-shadow:0_1px_0_rgb(0_0_0/0.05)]">
                      {content.highlight}
                    </span>
                  </>
                )}
              </h1>
              {content.description && (
                <p className="text-text/80 mt-4 max-w-md text-base sm:text-lg">{content.description}</p>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href={content.primaryCta.href} size="lg" className="rounded-full px-7">
                  {content.primaryCta.label}
                  <ArrowRight aria-hidden className="h-5 w-5" />
                </ButtonLink>
                {content.secondaryCta && (
                  <ButtonLink
                    href={content.secondaryCta.href}
                    variant="outline"
                    size="lg"
                    className="rounded-full px-7"
                  >
                    {content.secondaryCta.label}
                  </ButtonLink>
                )}
              </div>
            </div>

            <HeroSlides count={content.slides.length}>
              {content.slides.map((s, i) => (
                <div key={i} className="relative aspect-[4/3] w-full">
                  <StoreImage
                    src={s.imageUrl}
                    alt={s.alt}
                    sizes="(min-width: 768px) 55vw, 100vw"
                    priority={i === 0}
                    className="bg-transparent"
                  />
                </div>
              ))}
            </HeroSlides>
          </div>
        </div>
      </Container>
    </section>
  );
}
