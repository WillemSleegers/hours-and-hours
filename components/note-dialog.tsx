"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

  useEffect(() => {
    setNote(initialNote || "");
  }, [initialNote]);

  const handleSave = () => {
    // Save trimmed note, or empty string if it's only whitespace
    // The hook will handle converting empty string to null
    onSave(note.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note for {projectName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="What did you work on?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
