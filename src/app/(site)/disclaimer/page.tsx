import type { Metadata } from "next";

import { StaticPageBody, staticPageMetadata } from "@/components/content/static-page";
import { DISCLAIMER } from "@/config/legal";

export const metadata: Metadata = staticPageMetadata(DISCLAIMER);

/** `/disclaimer` — §4. Copy lives in `config/legal.ts`. */
export default function Page() {
  return <StaticPageBody page={DISCLAIMER} />;
}
