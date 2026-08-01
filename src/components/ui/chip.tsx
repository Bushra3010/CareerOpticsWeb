import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Interactive pill used for course nav, filter tokens and quick links.
 * Unlike Badge (a static label) a Chip is clickable or removable.
 */
const chipVariants = cva(
  "inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-border bg-white text-body hover:border-brand-blue-400 hover:text-brand-blue data-[selected=true]:border-brand-blue data-[selected=true]:bg-brand-blue-50 data-[selected=true]:text-brand-blue",
        solid: "border-transparent bg-brand-blue-50 text-brand-blue hover:bg-brand-blue-400/15",
        // sits on the dark translucent bar over the hero (§5.1 item 3)
        onDark:
          "border-white/25 bg-white/10 text-white hover:bg-white/20 data-[selected=true]:bg-white data-[selected=true]:text-brand-blue",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Chip({
  className,
  variant,
  asChild = false,
  selected,
  onRemove,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof chipVariants> & {
    asChild?: boolean;
    selected?: boolean;
    onRemove?: () => void;
  }) {
  const classes = cn(chipVariants({ variant }), className);

  // Slot accepts exactly one element child, so the remove affordance is only
  // available on the real <button> form. asChild is for link chips.
  if (asChild) {
    return (
      <Slot.Root
        data-slot="chip"
        data-selected={selected ? "true" : undefined}
        className={classes}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type="button"
      data-slot="chip"
      data-selected={selected ? "true" : undefined}
      aria-pressed={selected}
      className={classes}
      {...props}
    >
      {children}
      {onRemove ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label="Remove"
          className="-mr-1 rounded-full p-0.5 hover:bg-black/10"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <X />
        </span>
      ) : null}
    </button>
  );
}

export { Chip, chipVariants };
