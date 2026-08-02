"use client";

import * as React from "react";

/**
 * §5.3 sticky tab nav with scroll-spy.
 *
 * Real anchor links, so every section is reachable (and crawlable) before this
 * hydrates; the observer only adds the "which section am I in" highlight.
 */
export function CollegeTabNav({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [active, setActive] = React.useState(sections[0]?.id ?? "");
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost section currently intersecting wins, so scrolling up and
        // down both land on the section actually under the nav.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        // Ignore the band hidden behind the sticky header + tab bar.
        rootMargin: "-140px 0px -60% 0px",
        threshold: 0,
      },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [sections]);

  // Keep the active tab in view on the mobile scroller.
  React.useEffect(() => {
    const current = listRef.current?.querySelector<HTMLElement>(
      `[data-tab="${active}"]`,
    );
    current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav
      aria-label="College sections"
      className="sticky top-16 z-30 border-y bg-white"
    >
      <div className="container-site">
        <ul
          ref={listRef}
          className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section) => {
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  data-tab={section.id}
                  aria-current={isActive ? "true" : undefined}
                  className={
                    isActive
                      ? "relative inline-block px-3 py-3 text-sm font-semibold whitespace-nowrap text-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full after:bg-brand-orange focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      : "inline-block px-3 py-3 text-sm font-medium whitespace-nowrap text-body hover:text-brand-blue focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  }
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
