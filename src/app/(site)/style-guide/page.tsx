import Link from "next/link";

import { Download, GraduationCap, Phone, Search } from "lucide-react";

import { CourseChipNav } from "@/components/site/course-chip-nav";
import { ToastDemo } from "@/components/site/style-guide-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Rating } from "@/components/ui/rating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

/** P2 done-criteria (§16): every §6.4 component in brand colours. */
export default function StyleGuidePage() {
  return (
    <div className="container-site py-12 lg:py-16">
      <header>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Style guide</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="heading-underline mt-4 text-h1">Style guide</h1>
        <p className="mt-4 max-w-prose text-body">
          Every primitive from PRD §6.4 in brand colours. Build UI from these —
          check here before writing a new component.
        </p>
      </header>

      <Section title="Colour tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {swatches.map((swatch) => (
            <div key={swatch.token} className="overflow-hidden rounded-xl border">
              <div className={`h-16 ${swatch.className}`} />
              <div className="p-3">
                <p className="text-sm font-semibold text-ink">{swatch.token}</p>
                <p className="text-xs text-muted-foreground">{swatch.use}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-brand-gradient p-6 text-white">
          <p className="font-display text-lg font-bold">bg-brand-gradient</p>
          <p className="text-sm text-white/80">
            Signature blue→red. College Finder band and heading underlines only.
          </p>
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <p className="text-h1">Heading 1 — 40/48, lg 56</p>
          <p className="text-h2">Heading 2 — 30/36</p>
          <p className="text-h3">Heading 3 — 22/28</p>
          <p className="text-base">
            Body — 15/24 Inter. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-sm text-muted-foreground">Small — 13/20 muted.</p>
          <p className="font-semibold tabular-nums text-ink">
            Data — ₹1,25,000 / year · ₹54,00,000 highest package · NIRF 41
          </p>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Apply Now</Button>
          <Button variant="outline">Know More</Button>
          <Button variant="secondary">Compare</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Read more</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">
            <Phone />
            Need Counselling
          </Button>
          <Button size="icon" aria-label="Download">
            <Download />
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 rounded-xl bg-brand-blue-900 p-4">
          <Button variant="inverse">Inverse — on dark</Button>
        </div>
      </Section>

      <Section title="Badge & Chip">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>NAAC A++</Badge>
          <Badge variant="secondary">UGC</Badge>
          <Badge variant="secondary">AICTE</Badge>
          <Badge variant="outline">Government</Badge>
          <Badge variant="new">New</Badge>
          <Badge variant="urgent">Admissions closing</Badge>
          <Badge variant="success">Approved</Badge>
          <Badge variant="rating">4.6</Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip>B.Tech</Chip>
          <Chip selected>MBA</Chip>
          <Chip variant="solid">MBBS</Chip>
          <Chip asChild>
            <Link href="/courses/bca">BCA (link)</Link>
          </Chip>
        </div>
      </Section>

      <Section title="Rating">
        <div className="flex flex-wrap items-center gap-6">
          <Rating value={4.6} count={128} />
          <Rating value={3.5} size="lg" />
          <Rating value={5} size="sm" showValue={false} />
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="sg-name">Full name</Label>
            <Input id="sg-name" placeholder="Rohit Kumar" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-phone">Mobile number</Label>
            <Input id="sg-phone" type="tel" placeholder="98765 43210" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-search">Search</Label>
            <div className="flex h-10 items-center gap-2 rounded-lg border px-3 focus-within:border-brand-blue-400 focus-within:ring-2 focus-within:ring-ring">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <input
                id="sg-search"
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search colleges…"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-level">Study level</Label>
            <Select>
              <SelectTrigger id="sg-level">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="after_12">After 12th</SelectItem>
                <SelectItem value="ug">Undergraduate</SelectItem>
                <SelectItem value="pg">Postgraduate</SelectItem>
                <SelectItem value="diploma">Diploma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-invalid">Invalid state</Label>
            <Input id="sg-invalid" aria-invalid defaultValue="12345" />
            <p className="text-sm text-brand-red">
              Enter a valid 10-digit Indian mobile number.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-disabled">Disabled</Label>
            <Input id="sg-disabled" disabled placeholder="Not editable" />
          </div>
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="card-lift">
            <CardHeader>
              <CardTitle className="font-display">
                National Institute of Technology Patna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Patna, Bihar</p>
              <div className="flex flex-wrap gap-2">
                <Badge>NAAC A</Badge>
                <Badge variant="secondary">UGC</Badge>
                <Badge variant="secondary">AICTE</Badge>
              </div>
              <Rating value={4.4} count={86} />
              <p className="text-sm">
                <span className="font-semibold tabular-nums text-ink">
                  ₹1,80,000
                </span>{" "}
                <span className="text-muted-foreground">/ year</span>
              </p>
              <div className="flex gap-2">
                <Button size="sm">Apply Now</Button>
                <Button size="sm" variant="outline">
                  Know More
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Skeleton loading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-28" />
            </CardContent>
          </Card>

          <Card className="border-brand-blue bg-brand-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <GraduationCap className="size-5 text-brand-blue" />
                Inline lead card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Not sure which college? Get free counselling from our experts.
              </p>
              <Button size="sm">Get Free Counselling</Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Tabs & Accordion">
        <div className="grid gap-8 lg:grid-cols-2">
          <Tabs defaultValue="after-12">
            <TabsList variant="line">
              <TabsTrigger value="after-10">After 10th</TabsTrigger>
              <TabsTrigger value="after-12">After 12th</TabsTrigger>
              <TabsTrigger value="ug">After UG</TabsTrigger>
            </TabsList>
            <TabsContent value="after-10" className="pt-4 text-body">
              Polytechnic diplomas, ITI trades and D.El.Ed.
            </TabsContent>
            <TabsContent value="after-12" className="pt-4 text-body">
              B.Tech, MBBS, B.Com, BBA, BA, B.Sc Nursing and more.
            </TabsContent>
            <TabsContent value="ug" className="pt-4 text-body">
              MBA, M.Tech, M.Sc, MCA, LLM and B.Ed.
            </TabsContent>
          </Tabs>

          <Accordion type="single" collapsible>
            <AccordionItem value="q1">
              <AccordionTrigger>Is counselling free?</AccordionTrigger>
              <AccordionContent>
                Yes — our counselling and application guidance are free for
                students. We are paid by partner universities.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>How soon will someone call?</AccordionTrigger>
              <AccordionContent>
                A counsellor typically calls within 24 hours on working days.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      <Section title="Dialog, Sheet & Toast">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Quick Enquiry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Get Free Counselling
                </DialogTitle>
                <DialogDescription>
                  Share your details and a counsellor will call you back.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sg-modal-name">Name</Label>
                  <Input id="sg-modal-name" placeholder="Your name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sg-modal-phone">Phone</Label>
                  <Input id="sg-modal-phone" placeholder="98765 43210" />
                </div>
                <Button size="lg">Submit</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Filters</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="font-display">Filters</SheetTitle>
                <SheetDescription>
                  The real filter sidebar arrives in P5.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-wrap gap-2 px-4">
                <Chip>Engineering</Chip>
                <Chip selected>Management</Chip>
                <Chip>Medical</Chip>
              </div>
            </SheetContent>
          </Sheet>

          <ToastDemo />
        </div>
      </Section>

      <Section title="Carousel">
        <Carousel className="mx-auto w-full max-w-3xl">
          <CarouselContent>
            {["Engineering", "Management", "Medical", "Commerce", "Law"].map(
              (stream) => (
                <CarouselItem key={stream} className="basis-1/2 lg:basis-1/3">
                  <Card className="card-lift h-full">
                    <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
                      <GraduationCap className="size-6 text-brand-blue" />
                      <p className="font-display font-bold text-ink">{stream}</p>
                      <p className="text-sm text-muted-foreground">
                        24 colleges
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ),
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Section>

      <Section title="Pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Section>

      <Section title="Course chip nav">
        <div className="overflow-hidden rounded-xl bg-brand-blue-900">
          <CourseChipNav className="bg-transparent" />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t pt-10 lg:mt-16">
      <h2 className="heading-underline text-h2">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

const swatches = [
  { token: "brand-blue-900", className: "bg-brand-blue-900", use: "Header, footer" },
  { token: "brand-blue", className: "bg-brand-blue", use: "Primary blue" },
  { token: "brand-blue-400", className: "bg-brand-blue-400", use: "Links, focus" },
  { token: "brand-blue-50", className: "bg-brand-blue-50", use: "Tinted sections" },
  { token: "brand-red", className: "bg-brand-red", use: "Primary CTA" },
  { token: "brand-red-600", className: "bg-brand-red-600", use: "CTA hover" },
  { token: "brand-orange", className: "bg-brand-orange", use: "NEW, urgency" },
  { token: "brand-amber", className: "bg-brand-amber", use: "Rating stars" },
  { token: "ink", className: "bg-ink", use: "Headings" },
  { token: "body", className: "bg-body", use: "Body text" },
  { token: "surface", className: "bg-surface", use: "Section bg" },
  { token: "success", className: "bg-success", use: "Positive state" },
];
