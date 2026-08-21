"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export type LoginState = { error: string | null };

/**
 * Admin sign-in — PRD §3, email + password via Supabase Auth.
 *
 * Failures return one generic message on purpose: telling an attacker whether
 * an email exists turns the login form into an account enumerator.
 */
export async function signIn(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    // `FormData.get` returns null for a missing field, and `.optional()` only
    // accepts undefined — without this the whole parse fails whenever the
    // hidden `next` input is absent, which is every normal sign-in.
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Those details did not match an account." };
  }

  // A signed-in account still needs an active profile row to be staff; the
  // admin layout enforces that and bounces anyone who does not have one.
  // Honour any valid same-origin `next` path so CRM visitors land back in the
  // CRM, not on the admin dashboard.
  const target =
    parsed.data.next &&
    parsed.data.next.startsWith("/") &&
    !parsed.data.next.startsWith("//") &&
    !parsed.data.next.includes("\\")
      ? parsed.data.next
      : "/admin";

  revalidatePath("/admin", "layout");
  redirect(target);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
