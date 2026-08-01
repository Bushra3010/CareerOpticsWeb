import {
  Briefcase,
  Calculator,
  Cpu,
  FlaskConical,
  GraduationCap,
  Palette,
  PenTool,
  Scale,
  Sprout,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * `streams.icon` stores a lucide icon name. The map is explicit rather than a
 * dynamic lookup so only the icons actually used get bundled.
 */
const ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  briefcase: Briefcase,
  stethoscope: Stethoscope,
  calculator: Calculator,
  "flask-conical": FlaskConical,
  palette: Palette,
  scale: Scale,
  sprout: Sprout,
  "pen-tool": PenTool,
  "graduation-cap": GraduationCap,
};

export function StreamIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || GraduationCap;
  return <Icon className={cn("size-5", className)} aria-hidden />;
}
