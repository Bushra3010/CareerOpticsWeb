"use client";

import dynamic from "next/dynamic";
import * as React from "react";

/**
 * Shared state for the navigation drawer.
 *
 * The header no longer opens it — it is now just the logo and the counselling
 * CTA — so the only trigger is the bottom tab bar's Profile tab. The sheet
 * (Radix Dialog + nav links) is still fetched on first open, keeping it out of
 * every route's First Load JS (§11).
 */
const MobileNavSheet = dynamic(
  () =>
    import("@/components/site/mobile-nav-sheet").then((m) => m.MobileNavSheet),
  { ssr: false },
);

const MobileMenuContext = React.createContext<() => void>(() => {});

export function useMobileMenu() {
  return React.useContext(MobileMenuContext);
}

export function MobileMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  // Stays mounted after the first open so the drawer keeps its close animation.
  const [loaded, setLoaded] = React.useState(false);

  const openMenu = React.useCallback(() => {
    setLoaded(true);
    setOpen(true);
  }, []);

  return (
    <MobileMenuContext.Provider value={openMenu}>
      {children}
      {loaded ? <MobileNavSheet open={open} onOpenChange={setOpen} /> : null}
    </MobileMenuContext.Provider>
  );
}
