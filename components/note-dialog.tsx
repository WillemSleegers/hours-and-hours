"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface NoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  initialNote?: string | null;
  projectName: string;
}

export function NoteDialog({
  open,
  onClose,
  onSave,
  initialNote,
  projectName,
}: NoteDialogProps) {
  const [note, setNote] = useState(initialNote || "");
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    setNote(initialNote || "");
  }, [initialNote]);

  // Save scroll position when opening
  useEffect(() => {
    if (open) {
      scrollPositionRef.current = window.scrollY;
    }
  }, [open]);

  const handleClose = () => {
    // Restore scroll position with smooth animation
    window.scrollTo({
      top: scrollPositionRef.current,
      behavior: 'smooth'
    });
    onClose();
  };

  const handleSave = () => {
    // Save trimmed note, or empty string if it's only whitespace
    // The hook will handle converting empty string to null
    onSave(note.trim());
    handleClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>{projectName}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          <Textarea
            id="note"
            placeholder="What did you work on?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            autoFocus
          />
        </div>
        <SheetFooter className="gap-2 flex-row pb-safe">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
