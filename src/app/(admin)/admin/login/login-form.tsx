"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Loader2 } from "lucide-react";

import { signIn, type LoginState } from "@/app/(admin)/admin/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: LoginState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="grid gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="h-11"
          placeholder="you@careeroptics.in"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Signing in…
        </>
      ) : (
        "Sign in"
      )}
    </Button>
  );
}
