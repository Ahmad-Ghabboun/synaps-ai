import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Risk, FileObject, DEMO_PROJECT } from "@/types/synaps";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import SettingsDialog from "@/components/SettingsDialog";
import { supabase } from "@/integrations/supabase/client";

// Parse SQAP markdown into sections
function parseSqapSections(sqap: string): { title: string; content: string }[] {
  if (!sqap) return [];
  const lines = sqap.split("\n");
  const sections: { title: string; content: string }[] = [];
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
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h4 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h4>;
        if (line.startsWith("- **")) {
          const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
          if (match) return <p key={i} className="text-sm text-muted-foreground ml-4"><strong className="text-foreground">{match[1]}:</strong> {match[2]}</p>;
        }
        if (line.startsWith("- ")) return <p key={i} className="text-sm text-muted-foreground ml-4">• {line.slice(2)}</p>;
        if (line.match(/^\d+\.\s/)) return <p key={i} className="text-sm text-muted-foreground ml-4">{line}</p>;
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
      })}
    </div>
  );
}

// Circular gauge
function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[200px]">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke="hsl(var(--primary))" strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-foreground">{animatedScore}</span>
          <span className="text-sm text-muted-foreground">{grade}</span>
          <span className="text-xs text-muted-foreground mt-1">Completeness Score</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Technical: Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Business: Active</span>
        </div>
      </div>
    </div>
  );
}

// Pipeline stepper
function PipelineStepper({ activeStep }: { activeStep: number }) {
  const steps = [
    { label: "Skill 1: Extraction", desc: "The Architect" },
    { label: "Skill 2: Computation", desc: "The Dual Auditor" },
    { label: "Skill 3: Optimization", desc: "The Optimizer" },
  ];

  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
            i < activeStep
              ? "bg-primary border-primary"
              : i === activeStep
              ? "border-primary"
              : "border-border"
          }`}>
            {i < activeStep ? (
              <Check className="h-4 w-4 text-primary-foreground" />
            ) : i === activeStep ? (
              <>
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
              </>
            ) : (
              <div className="w-3 h-3 rounded-full bg-muted" />
            )}
          </div>
          <div>
            <p className={`text-sm font-medium ${i <= activeStep ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
            <p className="text-xs text-muted-foreground">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Risk card
function RiskCard({ risk, onFix }: { risk: Risk; onFix: (risk: Risk) => void }) {
  const isCritical = risk.severity === "critical";

  return (
    <div className={`rounded-lg p-4 border-l-4 ${
      isCritical ? "bg-destructive/5 border-destructive" : "bg-warning/5 border-warning"
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className={`text-base font-bold ${isCritical ? "text-destructive" : "text-warning"}`}>
          {risk.title}
        </h4>
        <Badge className={`text-xs shrink-0 ml-2 ${
          isCritical ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"
        }`}>
          {isCritical ? "CRITICAL" : "MODERATE"}
          {risk.confidence === "high" && " • HIGH CONFIDENCE"}
        </Badge>
      </div>
      <p className={`text-sm mb-2 ${isCritical ? "text-destructive/80" : "text-warning/80"}`}>
        {risk.description}
      </p>
      <p className={`text-xs mb-3 ${isCritical ? "text-destructive/60" : "text-warning/60"}`}>
        Section: {risk.section}
      </p>
      <button
        onClick={() => onFix(risk)}
        disabled={risk.isFixing}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:underline disabled:opacity-50 transition-colors"
      >
        {risk.isFixing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {risk.isFixing ? "Fixing..." : "FIX ISSUE"}
      </button>
    </div>
  );
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
    ...auditResult.risks.map((r: Risk, i: number) => [`Risk ${i + 1}: ${r.title}`, `${r.severity} — ${r.section}`]),
  ];
  return rows.map((r) => r.join(",")).join("\n");
}

export default function Workspace() {
  const navigate = useNavigate();
  const { state, dispatch, currentProject, updateCurrentProject } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState("status");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine pipeline step
  const activeStep = currentProject?.auditResult
    ? 2
    : currentProject?.sqap
    ? 1
    : 0;

  useEffect(() => {
    if (!currentProject) {
      navigate("/");
    }
  }, [currentProject, navigate]);

  if (!currentProject) return null;

  // Read SQAP from files array first, fallback to sqap field
  const sqapFile = currentProject.files?.find((f) => f.name === "SQAP.md");
  const sqapContent = sqapFile?.content || currentProject.sqap;
  const sections = parseSqapSections(sqapContent);

  // Read audit from files array
  const auditFile = currentProject.files?.find((f) => f.name === "Audit.json");
  const auditFromFile = auditFile ? JSON.parse(auditFile.content) : null;
  const activeAudit = auditFromFile || currentProject.auditResult;

  async function callSkill(skill: string, payload: Record<string, string>) {
    const { data, error } = await supabase.functions.invoke("synaps-ai", {
      body: { skill, ...payload },
    });
    if (error) throw error;
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
    setActiveTab("status");

    // Demo mode shortcut
    if (state.demoMode) {
      const files = buildFiles(DEMO_PROJECT.sqap, DEMO_PROJECT.auditResult);
      updateCurrentProject({
        sqap: DEMO_PROJECT.sqap,
        auditResult: DEMO_PROJECT.auditResult,
        score: DEMO_PROJECT.score,
        grade: DEMO_PROJECT.grade,
        files,
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
          files: allFiles,
        });
        setActiveTab("audit");
        toast.success("Dual audit complete!");
      } catch (err: any) {
        toast.error("Audit failed: " + (err.message || "Unknown error"));
      }
    } catch (err: any) {
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
        files,
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
        files: allFiles,
      });
      toast.success("Audit complete!");
    } catch (err: any) {
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
      const newScore = Math.min(100, currentProject.score + 20);
      const newGrade = newScore >= 90 ? "A" : newScore >= 80 ? "B" : newScore >= 70 ? "C" : newScore >= 60 ? "D" : "F";
      const newAudit = { ...activeAudit!, qualityScore: newScore, grade: newGrade, risks: updatedRisks };
      const files = buildFiles(currentProject.sqap, newAudit);
      updateCurrentProject({
        auditResult: newAudit,
        score: newScore,
        grade: newGrade,
        files,
      });
      toast.success(`Fixed: ${risk.title}`);
      return;
    }

    // Mark risk as fixing
    const risks = activeAudit?.risks.map((r: Risk) =>
      r.id === risk.id ? { ...r, isFixing: true } : r
    ) || [];
    updateCurrentProject({ auditResult: { ...currentProject.auditResult!, risks } });

    dispatch({ type: "SET_LOADING", loading: { optimizer: true } });
    try {
      const fixData = await callSkill("optimizer", {
        sqap: sqapContent,
        section: risk.section,
        title: risk.title,
        description: risk.description,
      });
      const fixedSection = fixData.result;

      const updatedSqap = replaceSectionInSQAP(currentProject.sqap, risk.section, fixedSection);
      updateCurrentProject({ sqap: updatedSqap });
      toast.success(`Fixed: ${risk.title}`);

      // Re-run audit
      dispatch({ type: "SET_LOADING", loading: { optimizer: false, auditor: true } });
      const persona = currentProject?.persona || "TPM";
      const deadline = currentProject?.deadline || "";
      const auditData = await callSkill("auditor", { sqap: updatedSqap, persona, deadline });
      const auditResult = auditData.result;
      const allFiles = buildFiles(updatedSqap, auditResult);
      updateCurrentProject({
        auditResult,
        score: auditResult.qualityScore,
        grade: auditResult.grade,
        files: allFiles,
      });
      toast.success("Score updated!");
    } catch (err: any) {
      toast.error("Fix failed: " + (err.message || "Unknown error"));
    } finally {
      dispatch({ type: "SET_LOADING", loading: { optimizer: false, auditor: false } });
    }
  }

  function replaceSectionInSQAP(sqap: string, sectionName: string, newContent: string): string {
    const lines = sqap.split("\n");
    const result: string[] = [];
    let inSection = false;
    let replaced = false;

    for (const line of lines) {
      if (line.startsWith("## ") && line.includes(sectionName)) {
        inSection = true;
        replaced = true;
        result.push(line);
        result.push(newContent);
        continue;
      }
      if (inSection && line.startsWith("## ")) {
        inSection = false;
      }
      if (!inSection) {
        result.push(line);
      }
    }
    if (!replaced) return sqap + "\n\n" + newContent;
    return result.join("\n");
  }

  function handleCopySection(content: string) {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
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

  const isAnyLoading = state.isLoading.architect || state.isLoading.auditor || state.isLoading.optimizer;
  const projectFiles = currentProject.files || [];
  const displayFiles = ["SQAP.md", "Audit.json", "Metrics.csv", "Report.pdf"];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Nav */}
      <nav className="bg-card border-b border-border h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="hover:bg-muted rounded-lg p-2 transition-colors" aria-label="Back to gallery">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-2xl font-bold text-primary">SYNAPS</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm font-medium text-muted-foreground">THE WORKSPACE</span>
          {currentProject.persona && (
            <Badge variant="outline" className="ml-2 text-xs">{currentProject.persona}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSettingsOpen(true)} className="hover:bg-muted rounded-lg p-2 transition-colors" aria-label="Settings">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="hover:bg-muted rounded-lg p-2 transition-colors" aria-label="Help">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="w-10 h-10 bg-muted rounded-full ml-2" aria-label="User avatar" />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left Panel - The Artifact */}
        <section className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">The Artifact</h2>
            {sqapContent && (
              <Button variant="outline" size="sm" onClick={() => {
                const sqapFileObj = projectFiles.find(f => f.name === "SQAP.md");
                if (sqapFileObj) handleDownloadFile(sqapFileObj);
              }}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            )}
          </div>

          <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto min-h-[300px]">
            {state.isLoading.architect ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating SQAP...</p>
              </div>
            ) : sections.length > 0 ? (
              <Accordion type="multiple" defaultValue={sections.map((_, i) => `section-${i}`)}>
                {sections.map((section, i) => (
                  <AccordionItem key={i} value={`section-${i}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{section.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopySection(section.content); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                          aria-label={`Copy ${section.title}`}
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <RenderMarkdown text={section.content} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p>Generated SQAP document will appear here...</p>
                <p className="text-xs mt-1">Use the input below to describe your project</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel - Mission Control (Tabbed) */}
        <section className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col overflow-hidden">
          <h2 className="text-2xl font-bold text-foreground mb-4">Mission Control</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 shrink-0">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
              <TabsTrigger value="gaps">Gap Feed</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* Status Tab */}
              <TabsContent value="status" className="mt-0 space-y-6">
                <PipelineStepper activeStep={activeStep} />
                {isAnyLoading && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {state.isLoading.architect ? "Running Architect..." : state.isLoading.auditor ? "Running Dual Audit..." : "Running Optimizer..."}
                  </div>
                )}
              </TabsContent>

              {/* Audit Tab */}
              <TabsContent value="audit" className="mt-0 space-y-6">
                <ScoreGauge score={currentProject.score} grade={currentProject.grade} />

                <Button
                  className="w-full py-4 text-lg font-bold"
                  size="lg"
                  onClick={runDualAudit}
                  disabled={!sqapContent || isAnyLoading}
                >
                  {state.isLoading.auditor ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Analyzing Document...
                    </>
                  ) : (
                    "RUN DUAL AUDIT"
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Show Raw JSON</span>
                  <Switch
                    checked={state.showRawJson}
                    onCheckedChange={(v) => dispatch({ type: "SET_SHOW_RAW_JSON", enabled: v })}
                  />
                </div>

                {state.showRawJson && activeAudit?.rawJson && (
                  <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs overflow-x-auto text-muted-foreground max-h-48">
                    {JSON.stringify(JSON.parse(activeAudit.rawJson), null, 2)}
                  </pre>
                )}
              </TabsContent>

              {/* Gap Feed Tab */}
              <TabsContent value="gaps" className="mt-0">
                <div className="space-y-3">
                  {activeAudit?.risks && activeAudit.risks.length > 0 ? (
                    activeAudit.risks.map((risk: Risk) => (
                      <RiskCard key={risk.id} risk={risk} onFix={handleFix} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No audit results yet.</p>
                      <p className="text-xs">Run the Dual Audit to analyze your project.</p>
                    </div>
                  )}
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
                          exists ? "bg-muted/50 hover:bg-muted cursor-pointer" : "bg-muted/20 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <FileText className={`h-8 w-8 mb-2 ${exists ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm text-muted-foreground text-center">{fileName}</span>
                        {exists && <span className="text-xs text-success mt-1">Ready</span>}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadAll}
                  disabled={projectFiles.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" /> Download All Assets
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </div>

      {/* Fixed Input Dock (non-floating) */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-4">
        <div className="max-w-full flex gap-3 items-end">
          <button className="shrink-0 p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Attach file">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
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
            className="flex-1 resize-none bg-transparent border border-input rounded-lg outline-none text-foreground placeholder:text-muted-foreground text-sm min-h-[48px] max-h-[120px] px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
          />
          <Button
            onClick={launchEngine}
            disabled={isAnyLoading}
            className="shrink-0 px-6"
          >
            {isAnyLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                LAUNCH ENGINE
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">⌘/Ctrl + Enter to launch</p>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
