/**
 * UPI helpers shared by the public admission form (server) and the CRM
 * (client). Pure — no server imports.
 */

/** `upi://pay` deep link with the amount filled in — opens any UPI app on a phone. */
export function upiPayUri(upiId: string, payeeName: string | null, amount: number, note: string): string {
  // The VPA goes in raw: some UPI apps reject `%40` in place of `@`.
  const vpa = upiId.replace(/[^\w.@-]/g, "");
  const rest = [
    ["pn", payeeName ?? "CareerOptics"],
    ["am", amount.toFixed(2)],
    ["cu", "INR"],
    ["tn", note.slice(0, 50)],
  ]
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `upi://pay?pa=${vpa}&${rest}`;
}
