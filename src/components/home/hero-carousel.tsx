"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { HeroBanner } from "@/lib/queries/home";
import { imageSrc } from "@/lib/media";

const AUTOPLAY_MS = 5000;

/**
 * §5.1 item 4. The first slide is server-rendered inside this client component,
 * so the H1 and hero art are in the HTML for LCP and for crawlers — only the
 * slide behaviour is hydrated.
 */
export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api || paused || banners.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [api, paused, banners.length]);

  if (banners.length === 0) return null;

  return (
    <section
      aria-label="Highlights"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="ml-0">
          {banners.map((banner, index) => (
            <HeroSlide
              key={banner.id}
              banner={banner}
              priority={index === 0}
              headingLevel={index === 0 ? "h1" : "p"}
            />
          ))}
        </CarouselContent>
      </Carousel>

      {banners.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10">
          <div className="container-site flex items-center justify-between gap-4">
            {/* Dots double as the keyboard control for the carousel. */}
            <div className="pointer-events-auto flex gap-2">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current}
                  onClick={() => api?.scrollTo(index)}
                  className={
                    index === current
                      ? "h-2 w-6 rounded-full bg-white transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-900 focus-visible:outline-none"
                      : "h-2 w-2 rounded-full bg-white/50 transition-all hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue-900 focus-visible:outline-none"
                  }
                />
              ))}
            </div>
            <p className="rounded-full bg-black/40 px-2.5 py-0.5 text-sm font-semibold text-white tabular-nums">
              {current + 1}/{banners.length}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function HeroSlide({
  banner,
  priority,
  headingLevel,
}: {
  banner: HeroBanner;
  priority: boolean;
  headingLevel: "h1" | "p";
}) {
  const src = imageSrc(banner.image_url);
  const Heading = headingLevel;

  return (
    <CarouselItem className="pl-0">
      <div className="relative h-[280px] overflow-hidden bg-brand-blue-900 lg:h-[420px]">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        {/* 45% scrim keeps white text over any campus photo above 4.5:1 (§6.5) */}
        <div className="absolute inset-0 bg-brand-blue-900/45" aria-hidden />

        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
          <Heading
            className={
              headingLevel === "h1"
                ? "text-h1 lg:text-h1-lg max-w-3xl text-balance font-display text-white"
                : "text-h2 lg:text-h1 max-w-3xl text-balance font-display font-extrabold text-white"
            }
          >
            {banner.title}
          </Heading>

          <form
            action="/search"
            role="search"
            className="mt-6 flex w-full max-w-2xl items-center gap-2 rounded-xl bg-white p-1.5 shadow-card"
          >
            <label htmlFor={`hero-search-${banner.id}`} className="sr-only">
              Search for colleges, exams and courses
            </label>
            <Search
              className="ml-2 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              id={`hero-search-${banner.id}`}
              name="q"
              type="search"
              placeholder="Search for colleges, exams, courses and more.."
              className="h-10 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" className="shrink-0">
              Search
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/contact">Need Counselling</Link>
            </Button>
            {banner.cta_text && banner.cta_url ? (
              <Button asChild size="lg" variant="inverse" className="rounded-full">
                <Link href={banner.cta_url}>{banner.cta_text}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </CarouselItem>
  );
}
