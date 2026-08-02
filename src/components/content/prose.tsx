import { cn } from "@/lib/utils";

/**
 * Renders the light markdown editors write into `content` columns.
 *
 * Deliberately not a markdown library: the supported subset is headings,
 * paragraphs, bullets and bold, and everything is rendered as React elements
 * from parsed text — never `dangerouslySetInnerHTML`. Editor content is
 * untrusted input as far as this component is concerned, so raw HTML in a row
 * can never become markup on the page. Swap in a sanitising renderer if the
 * content model grows beyond this.
 */
export function Prose({
  content,
  className,
}: {
  content: string | null | undefined;
  className?: string;
}) {
  if (!content?.trim()) return null;

  const blocks = content.split(/\n{2,}/).filter((block) => block.trim());

  return (
    <div className={cn("max-w-3xl", className)}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={index} className="mt-8 text-h3 first:mt-0">
              {inline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="mt-6 text-base font-semibold text-ink first:mt-0">
              {inline(trimmed.slice(4))}
            </h3>
          );
        }

        const lines = trimmed.split("\n");
        if (lines.every((line) => /^[-*]\s+/.test(line.trim()))) {
          return (
            <ul key={index} className="mt-4 grid gap-2 first:mt-0">
              {lines.map((line, i) => (
                <li key={i} className="flex gap-2 text-body">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-blue-400" aria-hidden />
                  <span>{inline(line.trim().replace(/^[-*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="mt-4 text-pretty text-body first:mt-0">
            {inline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/** Splits `**bold**` runs into elements; everything else stays literal text. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
