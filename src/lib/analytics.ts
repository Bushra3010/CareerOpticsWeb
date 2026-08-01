/**
 * Conversion events — PRD §9 step 4.
 *
 * GTM and the Meta Pixel are not installed yet (§12 `NEXT_PUBLIC_GTM_ID` is
 * empty), so every call is a no-op until the tags land in P12. Calling these
 * unconditionally means the instrumentation is already in the right place when
 * they do.
 */

type Gtag = (command: string, event: string, params?: Record<string, unknown>) => void;
type Fbq = (command: string, event: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
    dataLayer?: unknown[];
  }
}

/** Fired once a lead row is confirmed saved, never on submit. */
export function trackLead(source: string, leadId: string | null) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", "generate_lead", {
    lead_source: source,
    lead_id: leadId,
  });
  window.fbq?.("track", "Lead", { source });

  // Also pushed raw so a GTM container can trigger on it without a gtag shim.
  window.dataLayer?.push({ event: "generate_lead", lead_source: source });
}

/** UTM parameters carried on the landing URL, forwarded with the lead (§7). */
export function readUtmParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
  };
}
