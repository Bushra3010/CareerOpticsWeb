"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Interactive leaf of SiteHeader. Only the trigger ships on first load — the
 * drawer (Radix Dialog + nav links) is fetched the first time it is opened,
 * which keeps the sheet out of every route's First Load JS (§11).
 */
const MobileNavSheet = dynamic(
  () => import("@/components/site/mobile-nav-sheet").then((m) => m.MobileNavSheet),
  { ssr: false },
);

export function MobileNav() {
  const [open, setOpen] = useState(false);
  // Stays true after the first open so the drawer keeps its close animation.
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
      >
        <Menu className="size-5" />
      </Button>
      {loaded ? <MobileNavSheet open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
