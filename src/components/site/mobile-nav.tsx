"use client";

import Link from "next/link";
import { useState } from "react";

import { Menu, Phone } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { levelNav, mainNav } from "@/config/nav";
import { siteConfig, telHref } from "@/config/site";

/** Interactive leaf of SiteHeader — the only client code in the header. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="sr-only">{siteConfig.name} menu</SheetTitle>
          <Logo onClick={() => setOpen(false)} />
        </SheetHeader>

        <nav className="flex flex-col p-4" aria-label="Main">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium text-ink hover:bg-brand-blue-50 hover:text-brand-blue"
            >
              {item.label}
              {item.badge ? (
                <Badge variant="new" size="sm">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          ))}

          <Separator className="my-3" />
          <p className="px-3 pb-1 text-sm font-semibold text-muted-foreground">
            Study level
          </p>
          {levelNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-body hover:bg-brand-blue-50 hover:text-brand-blue"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t p-4">
          <Button asChild size="lg" className="w-full">
            <a href={telHref}>
              <Phone />
              Call {siteConfig.phoneDisplay}
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
