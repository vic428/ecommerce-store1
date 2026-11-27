import Link from "next/link";
import type { CategorySummary } from "@/lib/catalog";
import { Container } from "@/components/ui/container";
import { NamedIcon } from "@/components/common/icon";
import { StoreImage } from "@/components/common/store-image";

export function CategoryStrip({ title, categories }: { title: string; categories: CategorySummary[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="shop-by-category" className="py-6 sm:py-8">
      <Container className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <h2
          id="shop-by-category"
          className="relative shrink-0 pb-2 text-xl leading-tight font-extrabold sm:text-2xl lg:w-36 lg:text-[28px]"
        >
          {title}
          <span aria-hidden className="bg-primary absolute bottom-0 left-0 h-[3px] w-12" />
        </h2>
        <ul className="-mx-4 flex snap-x scrollbar-none gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:flex lg:flex-1">
          {categories.map((c) => (
            <li key={c.id} className="w-28 shrink-0 snap-start sm:w-auto lg:flex-1">
              <Link
                href={`/categories/${c.slug}`}
                className="rounded-brand bg-surface text-text hover:bg-primary hover:text-primary-fg flex h-full min-h-24 flex-col items-center justify-center gap-2 px-2 py-4 text-center text-xs font-medium transition-colors sm:text-sm"
                title={c.description ?? undefined}
              >
                {c.imageUrl ? (
                  <span className="relative h-10 w-10">
                    <StoreImage src={c.imageUrl} alt="" sizes="40px" />
                  </span>
                ) : (
                  <NamedIcon name={c.icon} className="h-9 w-9" strokeWidth={1.25} />
                )}
                <span className="leading-tight">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
