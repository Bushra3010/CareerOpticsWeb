"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";

import { Bell, ChevronDown, User } from "lucide-react";

/**
 * Drawer state shared by the header's account button and the bottom bar's
 * Profile tab, so both open the same sheet. The sheet itself (Radix Dialog +
 * nav links) is still only fetched on first open, keeping it out of every
 * route's First Load JS (§11).
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

/**
 * Header account control. There is no student login in v1 (§3), so this opens
 * the navigation drawer rather than an account page.
 */
export function AccountButton() {
  const openMenu = useMobileMenu();

  return (
    <button
      type="button"
      onClick={openMenu}
      aria-haspopup="dialog"
      aria-label="Open menu"
      className="flex h-10 items-center gap-1 rounded-full border border-brand-blue-400/40 bg-brand-blue-50 px-2.5 text-brand-blue transition-colors hover:bg-brand-blue-400/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
    >
      <User className="size-5" aria-hidden />
      <ChevronDown className="size-4" aria-hidden />
    </button>
  );
}

/**
 * Header bell. No notification system exists, so it links to the news feed —
 * the closest thing to "what's new" — and carries no unread dot, which would
 * signal something waiting that never arrives.
 */
export function NotificationsButton() {
  return (
    <Link
      href="/news"
      aria-label="Latest admission news"
      className="flex size-10 items-center justify-center rounded-full text-brand-blue-900 transition-colors hover:bg-brand-blue-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
    >
      <Bell className="size-5" aria-hidden />
    </Link>
  );
}
