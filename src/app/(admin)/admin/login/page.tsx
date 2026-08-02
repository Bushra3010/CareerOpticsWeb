import type { Metadata } from "next";

import { LoginForm } from "@/app/(admin)/admin/login/login-form";
import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

/** `/admin/login` — §3, §5.5. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="mt-8 rounded-xl border bg-card p-6 shadow-card">
          <h1 className="text-h3">Staff sign in</h1>
          <p className="mt-1 text-sm text-body">
            For {siteConfig.name} counsellors and editors.
          </p>

          <div className="mt-6">
            {/* `next` is validated server-side before any redirect uses it. */}
            <LoginForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Students do not need an account — everything on the site is open.
        </p>
      </div>
    </main>
  );
}
