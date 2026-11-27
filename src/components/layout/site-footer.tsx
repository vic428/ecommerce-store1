import Link from "next/link";
import type { StoreSettings } from "@/lib/settings";
import { Container } from "@/components/ui/container";
import { PaymentMark, SocialIcon, socialLabel } from "@/components/common/brand-marks";
import { CurrentYear } from "@/components/common/current-year";
import { Logo } from "./logo";

export function SiteFooter({ settings }: { settings: StoreSettings }) {
  const { business, navigation, footer } = settings;

  return (
    <footer className="bg-secondary text-secondary-fg mt-auto">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
        <div className="space-y-4">
          <Logo business={business} inverted />
          {business.description && (
            <p className="text-secondary-fg/70 max-w-xs text-sm">{business.description}</p>
          )}
        </div>

        {navigation.footer.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 text-sm font-bold">{col.title}</h2>
            <ul className="text-secondary-fg/80 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="mb-4 text-sm font-bold">Connect With Us</h2>
          {business.social.length > 0 && (
            <ul className="flex flex-wrap gap-3">
              {business.social.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLabel(s.platform)}
                    className="rounded-brand text-secondary-fg hover:text-primary flex h-9 w-9 items-center justify-center hover:bg-white/10"
                  >
                    <SocialIcon platform={s.platform} className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <address className="text-secondary-fg/70 mt-4 space-y-1 text-sm not-italic">
            {business.email && (
              <a href={`mailto:${business.email}`} className="hover:text-primary block">
                {business.email}
              </a>
            )}
            {business.phone && (
              <a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary block">
                {business.phone}
              </a>
            )}
            {business.address && <span className="block">{business.address}</span>}
          </address>
        </div>

        {footer.paymentMarks.length > 0 && (
          <div>
            <h2 className="sr-only">Accepted payment methods</h2>
            <ul className="flex flex-wrap gap-2 lg:justify-end">
              {footer.paymentMarks.map((m) => (
                <li key={m}>
                  <PaymentMark mark={m} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
      <div className="border-t border-white/10">
        <Container className="text-secondary-fg/60 py-4 text-xs lg:text-right">
          {footer.copyright ?? (
            <>
              © <CurrentYear /> {business.name}. All rights reserved.
            </>
          )}
        </Container>
      </div>
    </footer>
  );
}
