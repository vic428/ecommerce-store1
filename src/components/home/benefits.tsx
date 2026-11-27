import type { HomepageBlock } from "@/lib/settings";
import { Container } from "@/components/ui/container";
import { NamedIcon } from "@/components/common/icon";

type Content = Extract<HomepageBlock, { type: "BENEFITS" }>["content"];

export function Benefits({ content }: { content: Content }) {
  return (
    <section aria-label="Why shop with us" className="py-6 sm:py-8">
      <Container>
        <ul className="rounded-brand bg-border grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((b) => (
            <li key={b.title} className="bg-surface flex items-center gap-4 px-5 py-5">
              <NamedIcon name={b.icon} className="text-text h-9 w-9 shrink-0" strokeWidth={1.25} />
              <div>
                <p className="text-sm font-bold">{b.title}</p>
                {b.description && <p className="text-muted text-xs">{b.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
