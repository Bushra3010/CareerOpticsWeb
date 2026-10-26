"use client";

import { LoginOptions } from "@/components/site/login-options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { websiteAdminHref } from "@/config/nav";

export function LoginChooserContent({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h3 font-display text-ink">Login</DialogTitle>
          <DialogDescription>Choose how you want to sign in</DialogDescription>
        </DialogHeader>
        <LoginOptions />
        <a
          href={websiteAdminHref}
          className="text-center text-sm text-muted-foreground hover:text-brand-blue-400"
        >
          Website content admin →
        </a>
      </DialogContent>
    </Dialog>
  );
}
