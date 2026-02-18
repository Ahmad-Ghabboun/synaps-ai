import React from "react";
import { useApp } from "@/context/AppContext";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { state, dispatch } = useApp();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure SYNAPS preferences</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Demo Mode</p>
              <p className="text-xs text-muted-foreground">
                Use sample Fintech data to bypass API calls
              </p>
            </div>
            <Switch
              checked={state.demoMode}
              onCheckedChange={(v) => {
                dispatch({ type: "SET_DEMO_MODE", enabled: v });
                localStorage.setItem("synaps_demo_mode", String(v));
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Technical View</p>
              <p className="text-xs text-muted-foreground">
                Show raw JSON output from auditors
              </p>
            </div>
            <Switch
              checked={state.showRawJson}
              onCheckedChange={(v) => dispatch({ type: "SET_SHOW_RAW_JSON", enabled: v })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
