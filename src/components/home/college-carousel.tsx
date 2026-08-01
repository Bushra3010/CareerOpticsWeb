import { CollegeCard } from "@/components/college/college-card";
import { ScrollRow } from "@/components/home/scroll-row";
import type { FeaturedCollege } from "@/lib/queries/home";

/** §5.1 item 7 — "Top Universities". */
export function CollegeCarousel({ colleges }: { colleges: FeaturedCollege[] }) {
  return (
    <ScrollRow label="Top universities" className="items-stretch">
      {colleges.map((college) => (
        <CollegeCard
          key={college.id}
          college={college}
          className="w-[280px] shrink-0 snap-start"
        />
      ))}
    </ScrollRow>
  );
}
