"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { StreamIcon } from "@/components/home/stream-icon";
import { Chip } from "@/components/ui/chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LevelTab } from "@/lib/queries/home";

/**
 * §5.1 item 9. Outer tabs are the student's stage, each with a Courses /
 * Career pair. Tabs are a client leaf; the chips inside are ordinary links so
 * every course is still crawlable in the rendered HTML.
 */
export function LevelCourseTabs({ tabs }: { tabs: LevelTab[] }) {
  if (tabs.length === 0) return null;

  return (
    <Tabs defaultValue={tabs[0]!.slug} className="gap-6">
      <TabsList variant="line" className="h-auto flex-wrap justify-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.slug} value={tab.slug} className="px-3 py-2">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.slug} value={tab.slug}>
          <Tabs defaultValue="courses" className="gap-4">
            <TabsList>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="career">Career</TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              <ul className="flex flex-wrap gap-2">
                {tab.courses.map((course) => (
                  <li key={course.slug}>
                    <Chip asChild>
                      <Link href={`/courses/${course.slug}`}>{course.name}</Link>
                    </Chip>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="career">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tab.careers.map((career) => (
                  <li key={career.slug}>
                    <Link
                      href={`/streams/${career.slug}`}
                      className="card-lift flex h-full gap-3 rounded-xl border bg-card p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue">
                        <StreamIcon name={career.icon} className="size-4" />
                      </span>
                      <span>
                        <span className="block font-semibold text-ink">
                          {career.name}
                        </span>
                        {career.scope ? (
                          <span className="mt-0.5 line-clamp-2 block text-sm text-body">
                            {career.scope}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>

          <Link
            href={tab.href}
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-400 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            All options {tab.label.toLowerCase()}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </TabsContent>
      ))}
    </Tabs>
  );
}
