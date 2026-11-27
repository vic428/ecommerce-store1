import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { StoreShell } from "@/components/layout/store-shell";

/** Branded 404 with the storefront header/footer, for unknown URLs and notFound() calls. */
export default function NotFound() {
  return (
    <StoreShell>
      <Container className="flex flex-col items-center py-24 text-center">
        <p className="text-primary text-6xl font-extrabold">404</p>
        <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
        <p className="text-muted mt-2 max-w-md">It may have moved, or it isn&apos;t available yet.</p>
        <div className="mt-6 flex gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/shop" variant="outline">
            Browse products
          </ButtonLink>
        </div>
      </Container>
    </StoreShell>
  );
}
