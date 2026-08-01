"use client";

import dynamic from "next/dynamic";

/**
 * Toasts are never present on first paint, so sonner is pulled in as a lazy
 * chunk after hydration rather than counting against First Load JS (§11).
 */
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);

export function DeferredToaster() {
  return <Toaster position="top-center" richColors />;
}
