import Link from "next/link";
import type { AnnouncementSettings } from "@/lib/settings-schema";
import { NamedIcon } from "@/components/common/icon";
import { Container } from "@/components/ui/container";

export function AnnouncementBar({
  announcement,
  showAccountLinks,
}: {
  announcement: AnnouncementSettings;
  showAccountLinks: boolean;
}) {
  if (!announcement.enabled) return null;
  const links = [
    ...announcement.links,
    ...(showAccountLinks ? [{ label: "Login / Register", href: "/account/login" }] : []),
  ];

  return (
    <div className="bg-secondary text-secondary-fg" data-testid="announcement-bar">
      <Container className="flex h-9 items-center justify-between gap-4 text-xs font-medium">
        <ul className="flex min-w-0 items-center gap-6">
          {announcement.items.map((item, i) => (
            <li
              key={i}
              className={i === 0 ? "flex min-w-0 items-center gap-2" : "hidden items-center gap-2 lg:flex"}
            >
              {item.icon && (
                <NamedIcon name={item.icon} className="text-primary h-4 w-4 shrink-0" strokeWidth={2} />
              )}
              <span className="truncate">{item.text}</span>
            </li>
          ))}
        </ul>
        {links.length > 0 && (
          <ul className="hidden shrink-0 items-center gap-4 sm:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}
