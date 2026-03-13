import { useState, useCallback } from "react";
import { Risk } from "@/types/synaps";
import { loadJiraConfig } from "@/components/JiraSettingsModal";

const JIRA_TICKETS_KEY = "synaps_jira_tickets";

export interface JiraTicket {
  id: string;
  key: string;
  url: string;
}

function loadTickets(): Record<string, JiraTicket> {
  try {
    const raw = localStorage.getItem(JIRA_TICKETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTickets(tickets: Record<string, JiraTicket>) {
  localStorage.setItem(JIRA_TICKETS_KEY, JSON.stringify(tickets));
}

export function useJira() {
  const [tickets, setTickets] = useState<Record<string, JiraTicket>>(loadTickets);
  const [creating, setCreating] = useState<string | null>(null);
  const [hasConfig, setHasConfig] = useState(() => !!loadJiraConfig());

  const refreshConfig = useCallback(() => {
    setHasConfig(!!loadJiraConfig());
  }, []);

  const createTicket = useCallback(async (risk: Risk): Promise<JiraTicket> => {
    const config = loadJiraConfig();
    if (!config) throw new Error("No Jira configuration found");

    setCreating(risk.id);
    try {
      const response = await fetch(
        "https://hushfedsqcxipzjcvcre.supabase.co/functions/v1/synaps-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2hmZWRzcWN4aXB6amN2Y3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzgxOTAsImV4cCI6MjA4Njk1NDE5MH0.rmcFx7MrZJHCekyFTY4rQXI1GLDZCUMH3Z3fXUh9Lt4",
          },
          body: JSON.stringify({
            skill: "jira",
            jiraBaseUrl: config.baseUrl,
            jiraEmail: config.email,
            jiraApiToken: config.apiToken,
            jiraProjectKey: config.projectKey,
            gap: risk,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || err.errorMessages?.[0] || `Jira error ${response.status}`
        );
      }

      const data = await response.json();
      const ticket: JiraTicket = {
        id: data.result.id,
        key: data.result.key,
        url: data.result.url,
      };

      const updated = { ...loadTickets(), [risk.id]: ticket };
      saveTickets(updated);
      setTickets(updated);
      return ticket;
    } finally {
      setCreating(null);
    }
  }, []);

  return { tickets, creating, hasConfig, refreshConfig, createTicket };
}