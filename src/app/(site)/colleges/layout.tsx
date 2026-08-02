import { NuqsAdapter } from "nuqs/adapters/next/app";

import { CompareProvider } from "@/components/college/compare-provider";
import { CompareTray } from "@/components/college/compare-tray";

/**
 * Shared shell for the listing and every college detail page.
 *
 * - nuqs backs the `/colleges` filter state (§5.2). Its adapter is mounted here
 *   rather than in the root layout — keeping it out of the shared chunk is
 *   worth ~6 kB of First Load JS on every other route (§11).
 * - The compare selection lives here too, so ticking Compare on a detail page
 *   and on the listing feed the same tray.
 */
export default function CollegesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NuqsAdapter>
      <CompareProvider>
        {children}
        <CompareTray />
      </CompareProvider>
    </NuqsAdapter>
  );
}
