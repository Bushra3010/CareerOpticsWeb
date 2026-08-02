import type { Metadata } from "next";

import { LevelHubPage, levelHubMetadata } from "@/components/taxonomy/level-hub";
import { LEVEL_HUBS } from "@/lib/queries/taxonomy";

const HUB = LEVEL_HUBS[3];

export const revalidate = 3600;
export const metadata: Metadata = levelHubMetadata(HUB);

/** `/after-pg` — level hub (§4). Content lives in LevelHubPage. */
export default function Page() {
  return <LevelHubPage hub={HUB} />;
}
