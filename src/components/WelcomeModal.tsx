import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "synaps-welcome-dismissed";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Welcome to Synaps</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-3 leading-relaxed">
            You are viewing a live demo of Synaps. Some features including creating new projects and changing settings are disabled in this version.
            <br /><br />
            The full platform includes real-time dual-LLM auditing, unlimited projects, and complete document generation.
            <br /><br />
            Contact{" "}
            <a href="mailto:ahmadghabboun@outlook.com" className="text-primary underline">
              ahmadghabboun@outlook.com
            </a>{" "}
            to learn more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button onClick={handleClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
