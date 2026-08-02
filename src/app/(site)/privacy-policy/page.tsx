import type { Metadata } from "next";

import { StaticPageBody, staticPageMetadata } from "@/components/content/static-page";
import { PRIVACY } from "@/config/legal";

export const metadata: Metadata = staticPageMetadata(PRIVACY);

/** `/privacy-policy` — §4. Copy lives in `config/legal.ts`. */
export default function Page() {
  return <StaticPageBody page={PRIVACY} />;
}
