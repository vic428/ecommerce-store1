import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/layout/logo";

/** Centered card layout for staff sign-in and password pages. */
export default async function AdminAuthLayout({ children }: LayoutProps<"/admin">) {
  const { business } = await getSettings();
  return (
    <main className="bg-surface flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo business={business} />
        </div>
        <div className="border-border bg-background rounded-brand border p-6 shadow-sm sm:p-8">
          {children}
        </div>
        <p className="text-muted mt-4 text-center text-xs">Staff access only. Activity is logged.</p>
      </div>
    </main>
  );
}
