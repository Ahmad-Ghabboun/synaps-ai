import React, { useState, useEffect } from "react";
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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setDarkMode(isDark);
  }, []);

  const handleThemeChange = (checked: boolean) => {
    setDarkMode(checked);
    const root = window.document.documentElement;
    if (checked) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    window.dispatchEvent(new Event("theme-change"));
  };

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
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Toggle dark theme
              </p>
            </div>
          <Switch checked={darkMode} onCheckedChange={handleThemeChange} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Demo Mode</p>
              <p className="text-xs text-muted-foreground">
                Demo mode is active
              </p>
            </div>
            <Switch checked={true} disabled />
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
