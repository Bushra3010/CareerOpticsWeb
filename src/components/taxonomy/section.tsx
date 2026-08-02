/** Content section on a taxonomy page — heading, optional lead-in, body. */
export function TaxonomySection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="py-8 first:pt-0">
      <h2 className="heading-underline text-h2">{title}</h2>
      {description ? (
        <p className="mt-4 max-w-3xl text-pretty text-body">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
