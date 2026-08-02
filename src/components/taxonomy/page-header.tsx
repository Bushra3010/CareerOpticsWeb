import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { name: string; href?: string };

/** Shared breadcrumb + heading block for every taxonomy page (§7 interlinking). */
export function PageHeader({
  crumbs,
  title,
  description,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  description?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b bg-surface">
      <div className="container-site py-6 lg:py-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb) => (
              <BreadcrumbItem key={crumb.name}>
                <BreadcrumbSeparator />
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.name}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="heading-underline mt-4 text-h2 lg:text-h1">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-pretty text-body">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  );
}
