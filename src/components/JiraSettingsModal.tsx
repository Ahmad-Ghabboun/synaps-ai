import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const JIRA_CONFIG_KEY = "synaps_jira_config";

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export function loadJiraConfig(): JiraConfig | null {
  try {
    const raw = localStorage.getItem(JIRA_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveJiraConfig(config: JiraConfig) {
  localStorage.setItem(JIRA_CONFIG_KEY, JSON.stringify(config));
}

interface JiraSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function JiraSettingsModal({
  open,
  onOpenChange,
  onSaved,
}: JiraSettingsModalProps) {
  const [config, setConfig] = useState<JiraConfig>({
    baseUrl: "",
    email: "",
    apiToken: "",
    projectKey: "",
  });

  useEffect(() => {
    if (open) {
      const saved = loadJiraConfig();
      if (saved) setConfig(saved);
    }
  }, [open]);

  const handleSave = () => {
    const cleaned = { ...config, baseUrl: config.baseUrl.replace(/\/$/, "") };
    saveJiraConfig(cleaned);
    onSaved();
    onOpenChange(false);
  };

  const isValid =
    config.baseUrl.trim() &&
    config.email.trim() &&
    config.apiToken.trim() &&
    config.projectKey.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Jira Integration</DialogTitle>
          <DialogDescription>
            Connect Synaps to your Jira project to create tickets from audit gaps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="jira-url">Jira Base URL</Label>
            <Input
              id="jira-url"
              placeholder="https://mycompany.atlassian.net"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jira-email">Email</Label>
            <Input
              id="jira-email"
              type="email"
              placeholder="you@company.com"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jira-token">API Token</Label>
            <Input
              id="jira-token"
              type="password"
              placeholder="Your Jira API token"
              value={config.apiToken}
              onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Generate at{" "}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                id.atlassian.com
              </a>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jira-project">Project Key</Label>
            <Input
              id="jira-project"
              placeholder="e.g. SYN"
              value={config.projectKey}
              onChange={(e) =>
                setConfig({ ...config, projectKey: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}