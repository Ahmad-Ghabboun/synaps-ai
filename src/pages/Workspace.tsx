import React, { useState, useEffect, useRef, useCallback } from "react";
import synapsWordmark from "@/assets/synaps-wordmark.png";

import { useNavigate, useLocation } from "react-router-dom";
import {
  Settings,
  HelpCircle,
  Copy,
  Download,
  FileText,
  Sparkles,
  Paperclip,
  Send,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  AlertTriangle,
  AlertCircle,
  GripVertical,
  Github,
  ExternalLink,
  Pencil,
  Share2 } from
"lucide-react";
import { useApp } from "@/context/AppContext";
import { Risk, FileObject, DEMO_PROJECT } from "@/types/synaps";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SettingsDialog from "@/components/SettingsDialog";
import JiraSettingsModal from "@/components/JiraSettingsModal";
import { SkillsStatus } from "@/components/SkillsStatus";
import AuditDashboard from "@/components/AuditDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useJira, JiraTicket } from "@/hooks/useJira";

// Parse SQAP markdown into sections
function parseSqapSections(sqap: string): {title: string;content: string;}[] {
  if (!sqap) return [];
  const lines = sqap.split("\n");
  const sections: {title: string;content: string;}[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = line.replace("## ", "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }
  return sections;
}

// Simple markdown renderer
function RenderMarkdown({ text }: {text: string;}) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const cleanLine = line.replace(/\*\*/g, "").trim();

        // 1. Headers (###) - Large & Bold
        if (line.startsWith("### ")) {
          return <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">{cleanLine.slice(4)}</h2>;
        }

        // 2. Bold Bullets - High Contrast & Large Bullets
        if (line.trim().match(/^[-*•]/)) {
          const textOnly = cleanLine.replace(/^[-*•]\s*/, "");
          const colonIndex = textOnly.indexOf(':');

          if (colonIndex !== -1) {
            const label = textOnly.substring(0, colonIndex);
            const description = textOnly.substring(colonIndex + 1);

            return (
              <p key={i} className="text-base text-foreground ml-4 flex items-start leading-relaxed">
                {/* Bigger, Black Bullet */}
                <span className="mr-3 text-foreground font-bold text-lg shrink-0">•</span>
                <span>
                  <strong className="font-bold text-foreground">{label}:</strong>
                  <span className="text-foreground/90 ml-1 font-normal">{description}</span>
                </span>
              </p>);

          }
        }

        // 3. Subtitles/Bold Sections (e.g., Executive Summary)
        if (line.trim() !== "" && !line.includes(":")) {
          return <p key={i} className="text-base font-regular text-foreground mt-4 mb-1">{cleanLine}</p>;
        }

        // 4. Regular Paragraphs - Dark Gray/Black Regular Font
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-base text-foreground/90 mb-3 leading-relaxed">{cleanLine}</p>;
      })}
    </div>);

}




// Risk card
function RiskCard({
  risk,
  onFix,
  onDismiss,
  onCreateJira,
  jiraTicket,
  isCreatingJira,
}: {
  risk: Risk;
  onFix: (risk: Risk) => void;
  onDismiss: (risk: Risk) => void;
  onCreateJira?: (risk: Risk) => void;
  jiraTicket?: JiraTicket | null;
  isCreatingJira?: boolean;
}) {
  const severityConfig: Record<string, { label: string; className: string }> = {
    critical: { label: "CRITICAL", className: "bg-red-500/15 text-red-700 border-red-300 dark:text-red-300 dark:border-red-700" },
    high: { label: "HIGH", className: "bg-orange-500/15 text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-700" },
    moderate: { label: "MODERATE", className: "bg-yellow-500/15 text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-700" },
    low: { label: "LOW", className: "bg-blue-500/15 text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-700" },
  };
  const sevInfo = severityConfig[risk.severity] || severityConfig.moderate;

  const isCritical = risk.severity === "critical";
  const isHighConfidence = risk.confidence === "high";
  const [isExpanded, setIsExpanded] = useState(false);

  const containerClasses = isCritical ?
  "bg-red-50 border-red-200 shadow-red-100/50 dark:bg-red-950/40 dark:border-red-900/50" :
  "bg-orange-50 border-orange-200 shadow-orange-100/50 dark:bg-orange-950/40 dark:border-orange-900/50";

  const iconColor = isCritical ?
  "text-red-500 dark:text-red-400" :
  "text-orange-500 dark:text-orange-400";

  return (
    <div
      className={`flex flex-wrap items-center justify-between p-4 rounded-2xl border-2 mb-3 cursor-pointer transition-all shadow-sm hover:shadow-md dark:shadow-none ${containerClasses}`}
      onClick={() => setIsExpanded(!isExpanded)}>

      <AlertCircle className={`h-6 w-6 mr-4 shrink-0 ${iconColor}`} />

      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {risk.title}
          </h4>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-bold ${sevInfo.className}`}>
            {sevInfo.label}
          </Badge>
          {jiraTicket && (
            <a
              href={jiraTicket.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              {jiraTicket.key}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Tap to view details
        </p>
      </div>

      <div className="ml-4 text-gray-400 dark:text-gray-500">
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>

      {isExpanded &&
      <div className="w-full mt-4 pl-10">
          <p className={`text-sm mb-2 ${isCritical ? "text-red-800 dark:text-red-200" : "text-orange-800 dark:text-orange-200"}`}>
            {risk.description}
          </p>
          <p className={`text-xs mb-3 ${isCritical ? "text-red-600/80 dark:text-red-400/80" : "text-orange-600/80 dark:text-orange-400/80"}`}>
            Section: {risk.section}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
              onClick={(e) => {
                e.stopPropagation();
                onFix(risk);
              }}
              disabled={risk.isFixing}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:underline disabled:opacity-50 transition-colors">
                {risk.isFixing ?
                <Loader2 className="h-4 w-4 animate-spin" /> :
                <Sparkles className="h-4 w-4" />
                }
                {risk.isFixing ? "Fixing issue..." : "FIX ISSUE"}
              </button>

              {isHighConfidence && onCreateJira && !jiraTicket && (
                <span className="relative inline-flex items-center group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info("Available in full version");
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-400 dark:text-blue-600 opacity-50 cursor-not-allowed transition-colors"
                    title="Available in full version"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.214 5.215h2.129v2.057A5.215 5.215 0 0 0 24.016 12.49V1.005A1.005 1.005 0 0 0 23.013 0z" />
                    </svg>
                    CREATE JIRA TICKET
                    <span className="ml-1 text-[9px] font-bold bg-amber-400 text-amber-900 rounded px-1 py-0 uppercase tracking-wide">Demo</span>
                  </button>
                </span>
              )}

              {jiraTicket && (
                <a
                  href={jiraTicket.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Added to Jira · {jiraTicket.key}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(risk);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      }
    </div>);

}

// Generate CSV from audit result
function generateMetricsCsv(auditResult: any, projectName: string): string {
  const rows = [
  ["Metric", "Value"],
  ["Project", projectName],
  ["Quality Score", String(auditResult.qualityScore)],
  ["Grade", auditResult.grade],
  ["Critical Risks", String(auditResult.risks.filter((r: Risk) => r.severity === "critical").length)],
  ["Moderate Risks", String(auditResult.risks.filter((r: Risk) => r.severity === "moderate").length)],
  ["Total Risks", String(auditResult.risks.length)],
  ...auditResult.risks.map((r: Risk, i: number) => [`Risk ${i + 1}: ${r.title}`, `${r.severity} — ${r.section}`])];

  return rows.map((r) => r.join(",")).join("\n");
}

export default function Workspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch, currentProject, updateCurrentProject } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jiraModalOpen, setJiraModalOpen] = useState(false);
  const { tickets: jiraTickets, creating: jiraCreating, hasConfig: hasJiraConfig, refreshConfig: refreshJiraConfig, createTicket: createJiraTicket } = useJira();
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState("audit");
  const [sqapContent, setSqapContent] = useState("");
  const [displayedSqapContent, setDisplayedSqapContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSqapContentRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);
  const [isCopiedWhole, setIsCopiedWhole] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline SQAP editing state
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editSectionContent, setEditSectionContent] = useState("");
  const [modifiedSections, setModifiedSections] = useState<Set<number>>(new Set());
  const [isReAuditing, setIsReAuditing] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // GitHub Integration State
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [isSyncOn, setIsSyncOn] = useState(false);

  const toggleSync = () => {
    const newState = !isSyncOn;
    setIsSyncOn(newState);
    if (newState) setIsGitHubConnected(true);
    toast.success(newState ? "GitHub Sync Enabled" : "GitHub Sync Paused");
  };

  // GitHub API Skill
  async function pushToGitHub(content: string) {
    if (!isGitHubConnected || !isSyncOn) return;

    // Placeholder for PAT - User instruction
    const PAT = import.meta.env.VITE_GITHUB_PAT;
    const OWNER = "your-username"; // Placeholder
    const REPO = "synaps-artifacts"; // Placeholder
    const PATH = "synaps-project.md";

    if (!PAT) {
      toast.error("GitHub Sync: Missing VITE_GITHUB_PAT in .env.local");
      return;
    }

    try {
      // 1. Get SHA if file exists
      let sha;
      try {
        const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
          headers: { Authorization: `Bearer ${PAT}` }
        });
        if (getRes.ok) {
          const data = await getRes.json();
          sha = data.sha;
        }
      } catch (e) {

        // File likely doesn't exist
      }
      // 2. Create or Update
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAT}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Update Artifact via Synaps AI",
          content: btoa(unescape(encodeURIComponent(content))),
          sha
        })
      });

      if (res.ok) {
        toast.success("Artifact synced to GitHub");
      } else {
        console.error("GitHub Sync Error:", await res.text());
        toast.error("Failed to sync to GitHub");
      }
    } catch (error) {
      console.error("GitHub Sync Error:", error);
      toast.error("Failed to sync to GitHub");
    }
  }

  // Theme & Design State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
      !("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputText]);

  useEffect(() => {
    const handleThemeChange = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  // Handle incoming prompt from dashboard
  useEffect(() => {
    if (location.state?.initialPrompt) {
      setInputText(location.state.initialPrompt);
    }
  }, [location.state]);

  // Determine pipeline step
  const activeStep = currentProject?.auditResult ?
  2 :
  currentProject?.sqap ?
  1 :
  0;

  useEffect(() => {
    if (!currentProject) {
      navigate("/");
    }
  }, [currentProject, navigate]);

  // File-driven re-render: watch project.files and extract SQAP.md content
  useEffect(() => {
    if (!currentProject) return;
    const sqapFile = currentProject.files?.find((f) => f.name === "SQAP.md");
    const newContent = sqapFile?.content || currentProject.sqap || "";
    setSqapContent(newContent);

    const prev = prevSqapContentRef.current;
    prevSqapContentRef.current = newContent;

    if (!newContent) {
      if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
      setIsStreaming(false);
      setDisplayedSqapContent("");
      return;
    }

    // prev === null: initial mount with existing content → set directly, no typewriter
    // prev === "": content was empty, now generated → typewrite
    // prev non-empty: optimizer fix or re-generation → set directly
    if (prev !== "") {
      setDisplayedSqapContent(newContent);
      return;
    }

    // New generation from empty → run typewriter at 8ms/char
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    let i = 0;
    setIsStreaming(true);
    setDisplayedSqapContent("");
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayedSqapContent(newContent.slice(0, i));
      if (i >= newContent.length) {
        clearInterval(typewriterRef.current!);
        typewriterRef.current = null;
        setIsStreaming(false);
      }
    }, 8);
  }, [currentProject?.files, currentProject?.sqap]);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current); };
  }, []);

  // Resizing logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newRightWidth = (containerRect.right - e.clientX) / containerRect.width * 100;
        if (newRightWidth >= 30 && newRightWidth <= 50) {
          setRightPanelWidth(newRightWidth);
        }
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isDragging, resize, stopResizing]);

  // Navbar renaming logic
  const handleNameClick = () => {
    setTempName(currentProject?.name || "Untitled");
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    const newName = tempName.trim() || "Untitled";
    if (currentProject && newName !== currentProject.name) {
      updateCurrentProject({ name: newName });
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  if (!currentProject) return null;

  const sections = parseSqapSections(displayedSqapContent);

  // Read audit from files array
  const auditFile = currentProject.files?.find((f) => f.name === "Audit.json");
  const auditFromFile = auditFile ? JSON.parse(auditFile.content) : null;
  const activeAudit = currentProject.auditResult || auditFromFile;

  async function callSkill(skill: string, payload: Record<string, string>) {
    const { data, error } = await supabase.functions.invoke("synaps-ai", {
      body: { skill, ...payload }
    });
    if (error) {
      console.error("Skill error:", error);
      let errorMessage = error.message || "Unknown error";
      // Try to extract the actual error message from the response body
      if ('context' in error && (error as any).context instanceof Response) {
        try {
          const response = (error as any).context;
          const clone = response.clone();
          const body = await clone.json();
          if (body && body.error) {
            errorMessage = body.error;
          }
        } catch {}
      }
      throw new Error(errorMessage);
    }
    return data;
  }

  function buildFiles(sqap: string, auditResult?: any): FileObject[] {
    const files: FileObject[] = [];
    if (sqap) {
      const header = `# ${currentProject!.name}\n${currentProject!.persona ? `**Persona:** ${currentProject!.persona}` : ""}\n${currentProject!.deadline ? `**Deadline:** ${new Date(currentProject!.deadline).toLocaleDateString()}` : ""}\n\n---\n\n`;
      files.push({ name: "SQAP.md", type: "md", content: header + sqap });
    }
    if (auditResult) {
      files.push({ name: "Audit.json", type: "json", content: JSON.stringify(auditResult, null, 2) });
      files.push({ name: "Metrics.csv", type: "csv", content: generateMetricsCsv(auditResult, currentProject!.name) });
    }
    return files;
  }

  // Skill 1 + 2 pipeline
  async function launchEngine() {
    if (!inputText.trim() && !currentProject?.description) {
      toast.error("Please enter a project description");
      return;
    }

    const description = inputText.trim() || currentProject?.description || "";
    updateCurrentProject({ description });
    setActiveTab("audit");

    // Demo mode shortcut
    if (state.demoMode) {
      const files = buildFiles(DEMO_PROJECT.sqap, DEMO_PROJECT.auditResult);
      updateCurrentProject({
        sqap: DEMO_PROJECT.sqap,
        auditResult: DEMO_PROJECT.auditResult,
        score: DEMO_PROJECT.score,
        grade: DEMO_PROJECT.grade,
        files
      });
      toast.success("Demo data loaded!");
      setInputText("");
      return;
    }

    // Skill 1: Architect
    dispatch({ type: "SET_LOADING", loading: { architect: true } });
    try {
      const persona = currentProject?.persona || "TPM";
      const deadline = currentProject?.deadline || "";
      const architectData = await callSkill("architect", { description, persona, deadline });
      const sqap = architectData.result;
      const files = buildFiles(sqap);
      updateCurrentProject({ sqap, files });
      pushToGitHub(sqap);
      toast.success("SQAP generated successfully!");

      // Skill 2: Dual Auditor
      dispatch({ type: "SET_LOADING", loading: { architect: false, auditor: true } });
      try {
        const auditData = await callSkill("auditor", { sqap, persona, deadline });
        const auditResult = auditData.result;
        const allFiles = buildFiles(sqap, auditResult);
        updateCurrentProject({
          auditResult,
          score: auditResult.qualityScore,
          grade: auditResult.grade,
          files: allFiles
        });
        setActiveTab("audit");
        toast.success("Dual audit complete!");
      } catch (err: any) {
        console.error("Audit error:", err);
        toast.error("Audit failed: " + (err.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("SQAP generation error:", err);
      toast.error("SQAP generation failed: " + (err.message || "Unknown error"));
    } finally {
      dispatch({ type: "SET_LOADING", loading: { architect: false, auditor: false } });
      setInputText("");
    }
  }

  // Skill 2 standalone
  async function runDualAudit() {
    if (!sqapContent) {
      toast.error("Generate a SQAP first");
      return;
    }

    if (state.demoMode) {
      const files = buildFiles(currentProject.sqap, DEMO_PROJECT.auditResult);
      updateCurrentProject({
        auditResult: DEMO_PROJECT.auditResult,
        score: DEMO_PROJECT.score,
        grade: DEMO_PROJECT.grade,
        files
      });
      toast.success("Demo audit loaded!");
      return;
    }

    dispatch({ type: "SET_LOADING", loading: { auditor: true } });
    try {
      const persona = currentProject?.persona || "TPM";
      const deadline = currentProject?.deadline || "";
      const auditData = await callSkill("auditor", { sqap: sqapContent, persona, deadline });
      const auditResult = auditData.result;
      const allFiles = buildFiles(currentProject.sqap, auditResult);
      updateCurrentProject({
        auditResult,
        score: auditResult.qualityScore,
        grade: auditResult.grade,
        files: allFiles
      });
      toast.success("Audit complete!");
    } catch (err: any) {
      console.error("Audit error:", err);
      toast.error("Audit failed: " + (err.message || "Unknown error"));
    } finally {
      dispatch({ type: "SET_LOADING", loading: { auditor: false } });
    }
  }

  // Skill 3: Auto-fix
  async function handleFix(risk: Risk) {
    if (!sqapContent) return;

    if (state.demoMode) {
      const updatedRisks = activeAudit?.risks.filter((r: Risk) => r.id !== risk.id) || [];
      // Increment by 30 pts per fix so the demo can progress past 95% quality gate
      const newScore = updatedRisks.length === 0 ? 97 : Math.min(96, currentProject.score + 30);
      const newGrade = newScore >= 90 ? "A" : newScore >= 80 ? "B" : newScore >= 70 ? "C" : newScore >= 60 ? "D" : "F";
      const newAudit = { ...activeAudit!, qualityScore: newScore, grade: newGrade, risks: updatedRisks };
      const files = buildFiles(currentProject.sqap, newAudit);
      updateCurrentProject({
        auditResult: newAudit,
        score: newScore,
        grade: newGrade,
        files
      });
      toast.success(`Fixed: ${risk.title}`);
      return;
    }

    // Mark risk as fixing
    const risks = activeAudit?.risks.map((r: Risk) =>
    r.id === risk.id ? { ...r, isFixing: true } : r
    ) || [];
    updateCurrentProject({ auditResult: { ...activeAudit, risks } });

    dispatch({ type: "SET_LOADING", loading: { optimizer: true } });
    try {
      const fixData = await callSkill("optimizer", {
        sqap: currentProject.sqap,
        section: risk.section,
        title: risk.title,
        description: risk.description
      });
      // Optimizer now returns the ENTIRE merged SQAP document
      const mergedSqap = fixData.result;
      const mergedFiles = buildFiles(mergedSqap, currentProject.auditResult);
      updateCurrentProject({ sqap: mergedSqap, files: mergedFiles });
      pushToGitHub(mergedSqap);
      toast.success(`Fixed: ${risk.title}`);

      // Re-run audit on the merged SQAP
      dispatch({ type: "SET_LOADING", loading: { optimizer: false, auditor: true } });
      const persona = currentProject?.persona || "TPM";
      const deadline = currentProject?.deadline || "";
      const auditData = await callSkill("auditor", { sqap: mergedSqap, persona, deadline });
      const auditResult = auditData.result;
      const allFiles = buildFiles(mergedSqap, auditResult);
      updateCurrentProject({
        sqap: mergedSqap,
        auditResult,
        score: auditResult.qualityScore,
        grade: auditResult.grade,
        files: allFiles
      });
      toast.success("Score updated!");
    } catch (err: any) {
      console.error("Fix error:", err);
      toast.error("Fix failed: " + (err.message || "Unknown error"));
    } finally {
      dispatch({ type: "SET_LOADING", loading: { optimizer: false, auditor: false } });
    }
  }

  function handleDismiss(risk: Risk) {
    if (!activeAudit) return;
    const updatedRisks = activeAudit.risks.filter((r: Risk) => r.id !== risk.id);
    const newAudit = { ...activeAudit, risks: updatedRisks };
    updateCurrentProject({
      auditResult: newAudit
    });
    toast.success("Risk dismissed");
  }




  async function handleCreateJira(risk: Risk) {
    if (!hasJiraConfig) {
      setJiraModalOpen(true);
      return;
    }
    try {
      const ticket = await createJiraTicket(risk);
      toast.success(
        <span>
          Ticket <strong>{ticket.key}</strong> created.{" "}
          <a href={ticket.url} target="_blank" rel="noopener noreferrer" className="underline">
            View in Jira
          </a>
        </span>
      );
    } catch (err: any) {
      toast.error("Jira error: " + (err.message || "Unknown error"));
    }
  }

  function handleCopySection(content: string, index: number) {
    navigator.clipboard.writeText(content);
    setCopiedSectionIndex(index);
    setTimeout(() => setCopiedSectionIndex(null), 2000);
    toast.success("Copied to clipboard");
  }

  function handleCopyWhole() {
    if (!sqapContent) return;
    navigator.clipboard.writeText(sqapContent);
    setIsCopiedWhole(true);
    setTimeout(() => setIsCopiedWhole(false), 2000);
    toast.success("Full artifact copied to clipboard");
  }

  // Inline SQAP editing
  function handleStartEdit(index: number, content: string) {
    setEditingSectionIndex(index);
    setEditSectionContent(content);
  }

  function handleSaveSection(index: number) {
    const updatedSections = sections.map((s, i) =>
      i === index ? { ...s, content: editSectionContent } : s
    );
    const newSqap = updatedSections.map((s) => `## ${s.title}\n\n${s.content}`).join("\n\n");
    updateCurrentProject({ sqap: newSqap, files: buildFiles(newSqap, activeAudit) });
    setModifiedSections((prev) => new Set(prev).add(index));
    setEditingSectionIndex(null);
    toast.success("Section saved");
  }

  function handleCancelEdit() {
    setEditingSectionIndex(null);
    setEditSectionContent("");
  }

  async function handleReAudit() {
    if (!sqapContent || !activeAudit) return;
    setIsReAuditing(true);
    try {
      const persona = currentProject?.persona || "TPM";
      const deadline = currentProject?.deadline || "";
      const auditData = await callSkill("auditor", { sqap: sqapContent, persona, deadline });
      const auditResult = auditData.result;
      const allFiles = buildFiles(sqapContent, auditResult);
      updateCurrentProject({
        auditResult,
        score: auditResult.qualityScore,
        grade: auditResult.grade,
        files: allFiles,
      });
      setModifiedSections(new Set());
      toast.success("Re-audit complete — score updated");
    } catch (err: any) {
      toast.error("Re-audit failed: " + (err.message || "Unknown error"));
    } finally {
      setIsReAuditing(false);
    }
  }

  // Share modal helpers
  function getShareUrl() {
    return `${window.location.origin}/view/${currentProject.id}`;
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(getShareUrl());
    toast.success("Link copied");
  }

  function handleShareEmail() {
    const gapCount = activeAudit?.risks?.length || 0;
    const subject = encodeURIComponent(`Synaps Audit: ${currentProject.name}`);
    const body = encodeURIComponent(
      `Project: ${currentProject.name}\nScore: ${currentProject.score}%\nGrade: ${currentProject.grade}\nGaps: ${gapCount}\n\nView: ${getShareUrl()}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  function handleDownloadReport() {
    const sqapFile = projectFiles.find((f) => f.name === "SQAP.md");
    if (sqapFile) handleDownloadFile(sqapFile);
    else toast.error("No SQAP file to download");
  }

  function handleDownloadFile(file: FileObject) {
    const mimeMap: Record<string, string> = { md: "text/markdown", json: "application/json", csv: "text/csv", pdf: "application/pdf" };
    const blob = new Blob([file.content], { type: mimeMap[file.type] || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}`);
  }

  function handleDownloadAll() {
    const files = currentProject.files || [];
    if (files.length === 0) {
      toast.error("No files to download");
      return;
    }
    // Download each file individually (no jszip dependency)
    files.forEach((f) => handleDownloadFile(f));
  }

  function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ext = file.name.split(".").pop() || "md";
      const validTypes = ["md", "json", "csv", "pdf"];
      const fileType = validTypes.includes(ext) ? ext : "md";
      const newFile: FileObject = { name: file.name, type: fileType as "md" | "json" | "csv" | "pdf", content };
      updateCurrentProject({
        sqap: content,
        files: [newFile, ...(currentProject.files?.filter((f) => f.name !== file.name) || [])]
      });
      toast.success(`Uploaded ${file.name} — ready to audit!`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const isAnyLoading = state.isLoading.architect || state.isLoading.auditor || state.isLoading.optimizer;
  const projectFiles = currentProject.files || [];
  const displayFiles = ["SQAP.md", "Audit.json", "Metrics.csv", "Report.pdf"];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Nav */}
      <nav className="bg-card border-b border-border h-16 flex items-center justify-between px-6 shrink-0 relative">
        {/* DEMO MODE banner */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-b-lg shadow-md select-none">
            ⚡ DEMO MODE
          </span>
        </div>
        <div className="flex items-center gap-4 z-10">
          <button onClick={() => navigate("/")} className="hover:bg-muted rounded-lg p-2 transition-colors" aria-label="Back to gallery">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <img src={synapsWordmark} alt="SYNAPS" className="h-12 object-contain" />
          <span className="text-muted-foreground">|</span>
          {isEditingName ?
          <div className="relative grid items-center max-w-md">
              <span className="col-start-1 row-start-1 opacity-0 whitespace-pre text-lg font-semibold pointer-events-none">
                {tempName || "Untitled"}
              </span>
              <input
              ref={nameInputRef}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="col-start-1 row-start-1 text-lg font-semibold text-foreground bg-transparent outline-none border-none p-0 w-full" />

            </div> :

          <span
            onClick={handleNameClick}
            className="text-lg font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors truncate max-w-md"
            title={currentProject.name || "Untitled"}>

              {(currentProject.name || "Untitled").length > 20 ?
            `${(currentProject.name || "Untitled").slice(0, 20)}...` :
            currentProject.name || "Untitled"}
            </span>
          }
          {currentProject.persona &&
          <Badge variant="outline" className="ml-2 text-xs">{currentProject.persona}</Badge>
          }
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <SkillsStatus activeStep={activeStep} />
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setShareModalOpen(true)}
            className="hover:bg-muted rounded-lg p-2 transition-colors"
            aria-label="Share project">
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => toast.info("Available in full version")}
            className="rounded-lg p-2 transition-all duration-300 text-muted-foreground opacity-40 cursor-not-allowed"
            aria-label="GitHub Sync — available in full version"
            title="Available in full version">

            <Github className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
            className={`hover:bg-muted rounded-lg p-2 transition-colors ${settingsDropdownOpen ? "bg-muted" : ""}`}
            aria-label="Settings">

            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
          
          {settingsDropdownOpen &&
          <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-xl p-4 z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dark Mode</span>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Demo Mode</span>
                <Switch checked={true} disabled={true} title="Locked in demo mode" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Technical View</span>
                <Switch checked={state.showRawJson} onCheckedChange={(v) => dispatch({ type: "SET_SHOW_RAW_JSON", enabled: v })} />
              </div>
            </div>
          }
          
          <a
            href="mailto:ahmadghabboun@outlook.com"
            className="hover:bg-muted rounded-lg p-2 transition-colors flex items-center"
            aria-label="Contact Us"
            title="Contact Us"
          >
            <HelpCircle className="h-5 w-5 text-primary" />
          </a>
          <div className="w-10 h-10 rounded-full ml-2 overflow-hidden bg-muted flex items-center justify-center" aria-label="User avatar">
            <img alt="User avatar" className="w-full h-full object-cover" src="/lovable-uploads/7e01bcf8-efa4-4e54-8767-386c6ea1fae1.jpg" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div ref={containerRef} className={`flex-1 overflow-hidden flex flex-col lg:flex-row gap-6 lg:gap-0 p-6 ${isDragging ? "select-none cursor-col-resize" : ""}`}>
        {/* Left Column Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 h-full gap-4">
          {/* Left Panel - The Artifact */}
          <section className="flex-1 bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col overflow-hidden min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">The Artifact</h2>
                {sqapContent && activeAudit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReAudit}
                    disabled={isReAuditing}
                  >
                    {isReAuditing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Re-Audit
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input ref={uploadRef} type="file" accept=".md,.txt,.csv" className="hidden" onChange={handleUploadFile} />
                <Button variant="outline" size="sm" onClick={() => uploadRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-1" /> Upload My Own
                </Button>
                <Button variant="outline" size="sm" disabled={!sqapContent} onClick={() => {
                  const sqapFileObj = projectFiles.find((f) => f.name === "SQAP.md");
                  if (sqapFileObj) handleDownloadFile(sqapFileObj);
                }}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!sqapContent}
                  onClick={handleCopyWhole}
                  className="w-9 px-0"
                  title="Copy entire artifact">
                  {isCopiedWhole ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto scrollbar-hide min-h-[300px]">
              {state.isLoading.architect ?
              <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating SQAP...</p>
                </div> :
              sections.length > 0 ?
              <>
              <Accordion type="multiple" defaultValue={sections.map((_, i) => `section-${i}`)}>
                  {sections.map((section, i) =>
                <AccordionItem key={i} value={`section-${i}`}>
                      <AccordionTrigger className="hover:no-underline group">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold">{section.title}</span>
                          {modifiedSections.has(i) && (
                            <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300 dark:text-yellow-300 dark:border-yellow-700 text-[10px] px-1.5 py-0">Modified</Badge>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(i, section.content); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                            aria-label={`Edit ${section.title}`}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => {e.stopPropagation();handleCopySection(section.content, i);}}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                            aria-label={`Copy ${section.title}`}>
                            {copiedSectionIndex === i ?
                              <Check className="h-3.5 w-3.5 text-green-500" /> :
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            }
                          </button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {editingSectionIndex === i ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editSectionContent}
                              onChange={(e) => setEditSectionContent(e.target.value)}
                              className="min-h-[150px] text-sm font-mono"
                              rows={8}
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                              <Button size="sm" onClick={() => handleSaveSection(i)}>Save</Button>
                            </div>
                          </div>
                        ) : (
                          <RenderMarkdown text={section.content} />
                        )}
                      </AccordionContent>
                    </AccordionItem>
                )}
                </Accordion>
                {isStreaming && (
                  <div className="flex items-center gap-2 mt-3 px-1">
                    <span className="inline-block w-0.5 h-4 bg-primary rounded animate-pulse" />
                    <span className="text-xs text-muted-foreground">Generating...</span>
                  </div>
                )}
              </> :

              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-30" />
                  <p>Generated SQAP document will appear here...</p>
                  <p className="text-xs mt-1">Use the input below to describe your project</p>
                </div>
              }
            </div>
          </section>

          {/* Prompt Input */}
          <div className="shrink-0">
            <div className="max-w-full">
              <div className="flex items-end gap-2 border border-input rounded-xl bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring shadow-sm">
                <button
                  className="shrink-0 p-3 hover:bg-muted rounded-lg transition-colors mb-1"
                  aria-label="Attach file"
                  onClick={() => uploadRef.current?.click()}>

                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      launchEngine();
                    }
                  }}
                  placeholder="Describe your project in detail..."
                  className="flex-1 resize-none bg-transparent outline-none border-none text-foreground placeholder:text-muted-foreground text-sm min-h-[40px] max-h-[300px] overflow-hidden py-1"
                  rows={1} />

                <button
                  onClick={launchEngine}
                  disabled={isAnyLoading}
                  className="shrink-0 mb-1 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">

                  {isAnyLoading ?
                  <Loader2 className="h-4 w-4 animate-spin" /> :

                  <Send className="h-4 w-4" />
                  }
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">⌘/Ctrl + Enter to launch</p>
            </div>
          </div>
        </div>

        {/* Drag Handle */}
        <div
          className="hidden lg:flex w-6 cursor-col-resize items-center justify-center shrink-0 hover:bg-primary/5 transition-colors group"
          onMouseDown={startResizing}>

          <div className={`w-1 h-12 rounded-full transition-colors ${isDragging ? "bg-primary" : "bg-border group-hover:bg-primary/50"}`} />
        </div>

        {/* Right Panel - Mission Control (Tabbed) */}
        <section
          className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col overflow-hidden min-w-0 h-full"
          style={{ width: window.innerWidth >= 1024 ? `${rightPanelWidth}%` : '100%' }}>

          <h2 className="text-2xl font-bold text-foreground mb-4">Mission Control</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 shrink-0">
              <TabsTrigger value="audit">Audit</TabsTrigger>
              <TabsTrigger value="gaps">Gap Feed</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto scrollbar-hide mt-4">
              {/* Audit Tab */}
              <TabsContent value="audit" className="mt-0 space-y-6">
                <AuditDashboard score={currentProject.score} grade={currentProject.grade} auditResult={activeAudit} sectionsCount={sections.length} isLoading={state.isLoading.auditor} />

                <Button
                  className="w-full py-4 text-lg font-bold"
                  size="lg"
                  onClick={runDualAudit}
                  disabled={!sqapContent || isAnyLoading}>

                  {state.isLoading.auditor ?
                  <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Analyzing Document...
                    </> :

                  "RUN DUAL AUDIT"
                  }
                </Button>

                {state.showRawJson && activeAudit?.rawJson &&
                <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs overflow-x-auto text-muted-foreground max-h-48">
                    {JSON.stringify(JSON.parse(activeAudit.rawJson), null, 2)}
                  </pre>
                }
              </TabsContent>

              {/* Gap Feed Tab */}
              <TabsContent value="gaps" className="mt-0">
                <div className="space-y-3">
                  {activeAudit?.risks && activeAudit.risks.length > 0 ?
                  activeAudit.risks.map((risk: Risk) =>
                  <RiskCard
                    key={risk.id}
                    risk={risk}
                    onFix={handleFix}
                    onDismiss={handleDismiss}
                    onCreateJira={handleCreateJira}
                    jiraTicket={jiraTickets[risk.id] ?? null}
                    isCreatingJira={jiraCreating === risk.id}
                  />
                  ) :

                  <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No audit results yet.</p>
                      <p className="text-xs">Run the Dual Audit to analyze your project.</p>
                    </div>
                  }
                </div>
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {displayFiles.map((fileName) => {
                    const file = projectFiles.find((f) => f.name === fileName);
                    const exists = !!file;
                    return (
                      <button
                        key={fileName}
                        onClick={() => file && handleDownloadFile(file)}
                        disabled={!exists}
                        className={`aspect-square border border-border rounded-lg flex flex-col items-center justify-center p-4 transition-colors ${
                        exists ? "bg-muted/50 hover:bg-muted cursor-pointer" : "bg-muted/20 opacity-50 cursor-not-allowed"}`
                        }>

                        <FileText className={`h-8 w-8 mb-2 ${exists ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm text-muted-foreground text-center">{fileName}</span>
                        {exists && <span className="text-xs text-success mt-1">Ready</span>}
                      </button>);

                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadAll}
                  disabled={projectFiles.length === 0}>

                  <Download className="h-4 w-4 mr-2" /> Download All Assets
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <JiraSettingsModal
        open={jiraModalOpen}
        onOpenChange={setJiraModalOpen}
        onSaved={refreshJiraConfig}
      />

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Share Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{currentProject.name}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Score: <strong className="text-foreground">{currentProject.score}%</strong></span>
                <span>Grade: <strong className="text-foreground">{currentProject.grade}</strong></span>
                <span>Gaps: <strong className="text-foreground">{activeAudit?.risks?.length || 0}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-muted rounded-md border border-input px-3 py-2 text-sm text-foreground opacity-50"
              />
              <Button
                size="sm"
                disabled
                onClick={() => toast.info("Available in full version")}
                title="Available in full version"
                className="opacity-50 cursor-not-allowed"
              >
                <Copy className="h-4 w-4 mr-1" /> Copy Link
                <span className="ml-1.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded px-1 py-0 uppercase tracking-wide">Demo</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 opacity-50 cursor-not-allowed"
                disabled
                onClick={() => toast.info("Available in full version")}
                title="Available in full version"
              >
                <Send className="h-4 w-4 mr-1" /> Share via Email
                <span className="ml-1.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded px-1 py-0 uppercase tracking-wide">Demo</span>
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownloadReport} disabled={!projectFiles.find((f) => f.name === "SQAP.md")}>
                <Download className="h-4 w-4 mr-1" /> Download Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}