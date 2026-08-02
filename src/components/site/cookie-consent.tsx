"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Cookie consent — PRD §15 ("Cookie consent banner, GTM gated — required for
 * Meta Pixel").
 *
 * The gate is real, not decorative: `hasAnalyticsConsent()` is what the GTM
 * loader will check in P12, and nothing tracking-related may run before this
 * returns true. Declining is a first-class choice — one click, same weight as
 * accepting, and the site works identically either way.
 *
 * The site's own strictly-necessary cookies (the finder session id, the admin
 * auth session) are not covered by this and do not wait for consent.
 */
const STORAGE_KEY = "careeroptics:cookie-consent";

export type ConsentValue = "accepted" | "declined";

/** Read from anywhere — the GTM loader gates on this in P12. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function CookieConsent() {
  // `null` until the effect has read storage, so nothing flashes on first paint
  // and the server render stays identical to the client's.
  const [decision, setDecision] = React.useState<ConsentValue | null | "unknown">(
    "unknown",
  );

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDecision(stored === "accepted" || stored === "declined" ? stored : null);
    } catch {
      setDecision(null);
    }
  }, []);

  const decide = (value: ConsentValue) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Private mode — the choice holds for this page view only.
    }
    setDecision(value);
    // P12's GTM loader listens for this rather than polling storage.
    window.dispatchEvent(new CustomEvent("careeroptics:consent", { detail: value }));
  };

  if (decision !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      // Above the mobile sticky bar, below any open modal.
      className="fixed inset-x-0 bottom-14 z-40 border-t bg-white shadow-[0_-4px_16px_rgb(15_23_42/0.12)] lg:bottom-0"
    >
      <div className="container-site flex flex-wrap items-center gap-4 py-4">
        <p className="min-w-[260px] flex-1 text-sm text-body">
          We would like to use analytics cookies to see which colleges students
          look for. They are optional — the site works the same either way. See
          our{" "}
          <Link
            href="/privacy-policy"
            className="font-semibold text-brand-blue-400 hover:underline"
          >
            privacy policy
          </Link>
          .
        </p>

        {/* Both buttons carry the same visual weight. A solid Accept next to a
            ghost Decline is a nudge, and consent that was nudged is not
            consent. */}
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => decide("declined")}>
            Decline
          </Button>
          <Button variant="outline" onClick={() => decide("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
