"use client";

//IMPORTS
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { coverOptions } from "@/lib/profile-options";


interface CoverPickerProps{
    currentId: string | null;
    currentGradient: string;
    onSelect: (id: string)=>void;
}

export function CoverPickerDialog({
    currentId,
    currentGradient,
    onSelect
}: CoverPickerProps
) {
    const [open, setOpen]=useState(false);

    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`h-48 ${currentGradient} w-full cursor-pointer hover:opacity-90 transition-opacity relative`}>
          <span className="absolute bottom-2 right-4 text-white/60 text-xs">Click to change cover</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose your cover</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {coverOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onSelect(opt.id); setOpen(false); }}
              className={`h-20 rounded-lg bg-gradient-to-r ${opt.gradient} hover:scale-105 transition-transform ${opt.id === currentId ? "ring-4 ring-primary ring-offset-2" : ""}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}