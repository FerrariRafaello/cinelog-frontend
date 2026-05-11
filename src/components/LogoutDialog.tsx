"use client";

// IMPORTS
import { useState } from "react";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";


export function LogoutDialog() {
    const [open, setOpen]=useState(false);

    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 backdrop-blur-sm px-2 py-2 pr-4 text-sm sm:text-base font-semibold text-foreground shadow-md hover:border-primary/60 hover:bg-card transition-colors"
        >
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">⎋</span>
          Sign out
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign out</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={logout}>
            Sign out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}