import { MessageCircle } from "lucide-react";

import { whatsappHref } from "@/config/site";

/**
 * Bottom-left WhatsApp FAB (§5.1). Sits above the mobile sticky bar so the two
 * never overlap on small screens.
 */
export function WhatsAppFab() {
  return (
    <a
      href={whatsappHref(
        "Hi CareerOptics, I would like free admission counselling.",
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-20 left-4 z-40 flex size-12 items-center justify-center rounded-full bg-success text-white shadow-card-hover transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none lg:bottom-6"
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
