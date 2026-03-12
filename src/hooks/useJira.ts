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
      const credentials = btoa(`${config.email}:${config.apiToken}`);
      const priority = risk.severity === "critical" ? "Highest" : "Medium";

      const body = {
        fields: {
          project: { key: config.projectKey },
          summary: risk.title,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: risk.description }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: `Impact: ${risk.impact}` }],
              },
            ],
          },
          issuetype: { name: "Bug" },
          priority: { name: priority },
          labels: ["synaps-audit"],
        },
      };

      const response = await fetch(`${config.baseUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.errorMessages?.[0] || err.message || `Jira error ${response.status}`
        );
      }

      const data = await response.json();
      const ticket: JiraTicket = {
        id: data.id,
        key: data.key,
        url: `${config.baseUrl}/browse/${data.key}`,
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