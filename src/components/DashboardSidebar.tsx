import React, { useState, useEffect } from "react";
import { Home, LayoutGrid, Users, Settings } from "lucide-react";
import logo from "@/assets/logo.png";
import logoDark from "@/assets/logo-dark.png";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import SettingsDialog from "@/components/SettingsDialog";

const navItems = [
{ icon: Home, label: "Dashboard", active: true },
{ icon: LayoutGrid, label: "Projects", active: false },
{ icon: Users, label: "Team", active: false }];


export default function DashboardSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("theme-change", check);
    return () => window.removeEventListener("theme-change", check);
  }, []);

  return (
    <>
      <aside className="w-16 h-screen sticky top-0 flex flex-col items-center py-4 gap-2 bg-card border-r border-border shrink-0">
        {/* Logo */}
        <div className="w-10 h-10 flex items-center justify-center rounded-xl mb-4 overflow-hidden">
          <img alt="Logo" className="h-7 w-7 object-contain" src={isDark ? logoDark : "/lovable-uploads/e531f254-382c-4aa5-b31d-66c255695f89.png"} />
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          {navItems.map(({ icon: Icon, label, active }) =>
          <Tooltip key={label}>
              <TooltipTrigger asChild>
                <button
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                active ?
                "bg-primary/10 text-primary" :
                "text-muted-foreground hover:bg-muted hover:text-foreground"}`
                }
                aria-label={label}>

                  <Icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          )}
        </nav>

        {/* Settings at bottom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings">

              <Settings className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </aside>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>);

}