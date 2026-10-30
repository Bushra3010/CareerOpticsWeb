"use client";

import Image from "next/image";
import * as React from "react";

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

  // Slides have different heights; size the viewport to the active one so a
  // shorter banner never leaves a gap below it.
  React.useEffect(() => {
    if (!api) return;
    const fit = () => {
      const slide = api.slideNodes()[api.selectedScrollSnap()];
      if (slide) api.rootNode().style.height = `${slide.offsetHeight}px`;
    };
    const observer = new ResizeObserver(fit);
    api.slideNodes().forEach((node) => observer.observe(node));
    api.rootNode().style.transition = "height 300ms ease-out";
    fit();
    // `select` fires as the slide starts moving; `settle` re-checks once it
    // has landed, in case an image finished loading in between.
    api.on("select", fit);
    api.on("settle", fit);
    return () => {
      observer.disconnect();
      api.off("select", fit);
      api.off("settle", fit);
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
        <CarouselContent className="ml-0 items-start">
          {banners.map((banner, index) => (
            <HeroSlide
              key={banner.id}
              banner={banner}
              priority={index === 0}
              isFirst={index === 0}
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
            <p className="rounded-full bg-black/60 px-2.5 py-0.5 text-sm font-semibold text-white tabular-nums ring-1 ring-white/20">
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
  isFirst,
}: {
  banner: HeroBanner;
  priority: boolean;
  isFirst: boolean;
}) {
  const desktopSrc = imageSrc(banner.image_url);
  const mobileSrc = imageSrc(banner.image_mobile_url) ?? desktopSrc;

  return (
    <CarouselItem className="pl-0" aria-label={banner.title ? `Banner: ${banner.title}` : undefined}>
      {/* Each banner renders at its own aspect ratio, full width — the
          client's artwork ranges from about 2:1 to 3:1 and is dense with text,
          so neither cropping nor letterboxing is acceptable. The carousel
          viewport animates to the active slide's height (see HeroCarousel). */}
      <div className="relative mx-4 overflow-hidden rounded-2xl bg-surface lg:mx-0 lg:rounded-none">
        {/* Mobile image — hidden on desktop, shown on mobile. */}
        {mobileSrc ? (
          <Image
            src={mobileSrc}
            alt=""
            width={1600}
            height={640}
            priority={priority}
            sizes="100vw"
            className="block h-auto w-full lg:hidden"
          />
        ) : null}
        {/* Desktop image — hidden on mobile, shown on desktop. */}
        {desktopSrc ? (
          <Image
            src={desktopSrc}
            alt=""
            width={1600}
            height={640}
            priority={priority}
            sizes="100vw"
            className="hidden h-auto w-full lg:block"
          />
        ) : null}
        {/* The banner title is the page's only h1. It is visually removed but
            kept for the document outline and search results — a home page with
            no h1 would be an SEO regression. */}
        {isFirst && banner.title ? (
          <h1 className="sr-only">{banner.title}</h1>
        ) : null}
      </div>
    </CarouselItem>
  );
}
