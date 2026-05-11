"use client";

// IMPORTS
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { avatarOptions } from "@/lib/profile-options";


interface AvatarPickerProps{
    currentId: string | null;
    userName: string;
    currentBg: string;
    onSelect: (id: string)=>void;
}

export function AvatarPickerDialog({
    currentId,
    userName,
    currentBg,
    onSelect
}: AvatarPickerProps) {
    const [open, setOpen]=useState(false);

    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`w-28 h-28 rounded-full border-4 border-background ${currentBg} flex items-center justify-center text-4xl font-bold text-white cursor-pointer hover:opacity-80 transition-opacity`}>
          {userName.charAt(0).toUpperCase()}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose your avatar color</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4 py-4">
          {avatarOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onSelect(opt.id); setOpen(false); }}
              className={`w-16 h-16 rounded-full ${opt.bg} flex items-center justify-center text-2xl font-bold text-white mx-auto hover:scale-110 transition-transform ${opt.id === currentId ? "ring-4 ring-primary ring-offset-2" : ""}`}
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}