"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { ChevronDown, Crosshair, MapPin } from "lucide-react";

import type { GoalCityOptions } from "@/lib/queries/home";

/**
 * §5.1 item 2 / §6.4 `GoalCitySelector`.
 *
 * Native `<select>` rather than a Radix menu: it works before hydration, gives
 * Android its own wheel picker, and costs no bundle — the same reasoning that
 * took `/colleges` from 196 to 163 kB in P11.
 *
 * Picking either option navigates straight to the matching `/colleges` filter,
 * so this is a shortcut into the P5 listing rather than a second search UI.
 */
export function GoalCitySelector({ options }: { options: GoalCityOptions }) {
  const router = useRouter();
  const [goal, setGoal] = React.useState("");
  const [city, setCity] = React.useState("");

  const go = (next: { goal?: string; city?: string }) => {
    const stream = next.goal ?? goal;
    const place = next.city ?? city;
    const params = new URLSearchParams();
    if (stream) params.set("stream", stream);
    if (place) params.set("city", place);
    if (params.size > 0) router.push(`/colleges?${params}`);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Picker
        id="home-goal"
        label="Select Goal"
        icon={<Crosshair className="size-4 text-brand-blue" aria-hidden />}
        value={goal}
        onChange={(value) => {
          setGoal(value);
          go({ goal: value });
        }}
        options={options.goals.map((g) => ({ value: g.slug, label: g.name }))}
      />
      <Picker
        id="home-city"
        label="Choose City"
        icon={<MapPin className="size-4 text-brand-blue" aria-hidden />}
        value={city}
        onChange={(value) => {
          setCity(value);
          go({ city: value });
        }}
        options={options.cities.map((c) => ({ value: c.slug, label: c.name }))}
      />
    </div>
  );
}

function Picker({
  id,
  label,
  icon,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative flex h-12 items-center gap-2 rounded-xl border bg-white px-3 focus-within:border-brand-blue-400 focus-within:ring-2 focus-within:ring-ring">
      {icon}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none bg-transparent pr-5 text-sm font-medium text-ink outline-none"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 size-4 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
