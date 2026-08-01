import { NuqsAdapter } from "nuqs/adapters/next/app";

/**
 * nuqs only backs the `/colleges` filter state (§5.2), so its adapter is
 * mounted here rather than in the root layout — keeping it out of the shared
 * chunk is worth ~6 kB of First Load JS on every other route (§11).
 */
export default function CollegesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
