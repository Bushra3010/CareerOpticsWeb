"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * 500 — PRD §11.
 *
 * Deliberately dependency-free: no `Button`, no icons, no config import. A
 * root `error.tsx` is a client boundary that Next ships with **every** route,
 * so anything it imports is paid for on pages that never error. Pulling the
 * button primitive in here cost ~12 kB of First Load JS site-wide.
 *
 * It also does not show `error.message`: a server error can carry a query, a
 * column name or a connection string, and this page is public. `digest` is
 * safe — it is the id Next writes to the server log.
 */
const PHONE = "+918252532179";
const PHONE_DISPLAY = "+91 82525 32179";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-16 text-center">
      <h1 className="text-h2">Something went wrong at our end</h1>
      <p className="mt-3 max-w-md text-pretty text-body">
        This is our problem, not yours. Try again in a moment — and if you were
        in the middle of an enquiry, call us and we will take it over the phone.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-brand-red-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Try again
        </button>
        <a
          href={`tel:${PHONE}`}
          className="inline-flex h-11 items-center rounded-lg border border-brand-blue px-6 font-semibold text-brand-blue hover:bg-brand-blue-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Call {PHONE_DISPLAY}
        </a>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-lg px-6 font-semibold text-brand-blue hover:bg-brand-blue-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Go home
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Reference: <code className="tabular-nums">{error.digest}</code>
        </p>
      ) : null}
    </main>
  );
}
