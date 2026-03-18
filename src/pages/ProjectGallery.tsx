import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Pencil, Trash2, CalendarIcon, Send, Copy, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useApp } from "@/context/AppContext";
import { Project, Persona, DEMO_DEADLINES } from "@/types/synaps";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import DashboardSidebar from "@/components/DashboardSidebar";
import WelcomeModal from "@/components/WelcomeModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface SyncNote {
  id: string;
  content: string;
  created_at: string;
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-primary";
  if (score >= 40) return "bg-warning";
  return "bg-destructive";
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const config: Record<string, string> = {
    Active: "bg-primary/10 text-primary border-primary/30",
    Pending: "bg-warning/10 text-warning border-warning/30",
    Done: "bg-success/10 text-success border-success/30",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-semibold", config[status] || "")}>
      {status}
    </Badge>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const handleRename = () => {
    if (newName.trim()) {
      dispatch({
        type: "UPDATE_PROJECT",
        project: { ...project, name: newName.trim(), updatedAt: new Date().toISOString() },
      });
      setIsRenaming(false);
      toast.success("Project renamed");
    }
  };

  const handleDelete = () => {
    toast.info("Cannot delete projects in demo mode");
  };

  const hasAudit = project.auditResult || project.score > 0;
  const editedDate = format(new Date(project.updatedAt), "MMM d, yyyy");

  // Calculate relative time
  const diffMs = Date.now() - new Date(project.updatedAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDaysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const relativeTime = diffHours < 24
    ? `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    : `${diffDaysAgo} day${diffDaysAgo !== 1 ? "s" : ""} ago`;

  return (
    <article
      className="group relative bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
      onClick={() => {
        if (!isRenaming) {
          dispatch({ type: "SET_CURRENT_PROJECT", id: project.id });
          navigate("/workspace");
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isRenaming) {
          dispatch({ type: "SET_CURRENT_PROJECT", id: project.id });
          navigate("/workspace");
        }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        {isRenaming ? (
          <input
            className="text-lg font-bold text-foreground bg-transparent border-b-2 border-primary outline-none flex-1 mr-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            <h3 className="text-lg font-bold text-foreground truncate">{project.name}</h3>
            <StatusBadge status={project.status} />
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted shrink-0"
              onClick={(e) => e.stopPropagation()}
              aria-label="Project options"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => { setIsRenaming(true); setNewName(project.name); }}>
              <Pencil className="h-4 w-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasAudit ? (
        <>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${scoreColor(project.score)} transition-all duration-500`}
              style={{ width: `${project.score}%` }}
            />
          </div>
          <p className="text-sm font-medium text-foreground">{project.score}%</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic">Not yet audited</p>
      )}

      <p className="text-xs text-muted-foreground mt-3">{relativeTime}</p>
    </article>
  );
}

// ─── Upcoming Deadlines ───

function DeadlineIcon({ urgency }: { urgency: "critical" | "upcoming" | "done" }) {
  if (urgency === "done") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <circle cx="8" cy="8" r="7" fill="hsl(var(--success))" fillOpacity="0.15" stroke="hsl(var(--success))" strokeWidth="1.5" />
        <path d="M5 8.5L7 10.5L11 6" stroke="hsl(var(--success))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (urgency === "critical") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 deadline-icon-critical">
        <circle cx="8" cy="8" r="7" fill="hsl(var(--destructive))" fillOpacity="0.15" stroke="hsl(var(--destructive))" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" fill="hsl(var(--destructive))" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="7" fill="hsl(var(--warning))" fillOpacity="0.15" stroke="hsl(var(--warning))" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3" fill="hsl(var(--warning))" />
    </svg>
  );
}

function UpcomingDeadlines() {
  const now = new Date();

  return (
    <div className="border border-border bg-card rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        Upcoming Deadlines
      </h3>
      <div className="space-y-2.5">
        {DEMO_DEADLINES.map((d) => {
          if (d.done) {
            return (
              <div key={d.projectId} className="flex items-center gap-2.5">
                <DeadlineIcon urgency="done" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-[10px] text-success font-medium">Done ✓</p>
                </div>
              </div>
            );
          }

          const deadlineDate = new Date(d.deadline!);
          const daysRemaining = differenceInDays(deadlineDate, now);
          const isCritical = daysRemaining <= 30;
          const urgency = isCritical ? "critical" : "upcoming";

          return (
            <div key={d.projectId} className="flex items-center gap-2.5">
              <DeadlineIcon urgency={urgency} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{d.name}</p>
                <p className={cn(
                  "text-[10px] font-medium",
                  isCritical ? "text-destructive" : "text-warning"
                )}>
                  {format(deadlineDate, "MMM d, yyyy")} · {daysRemaining} days remaining
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Notes Panel ───

function NoteItem({
  note,
  onDelete,
  onUpdate,
  onUseInPrompt,
  projects,
}: {
  note: SyncNote;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => Promise<void>;
  onUseInPrompt: (content: string, projectId: string) => void;
  projects: Project[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isPromptMode, setIsPromptMode] = useState(false);

  const handleSave = async () => {
    await onUpdate(note.id, editContent);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative bg-background border border-border rounded-xl p-3 hover:shadow-sm transition-all duration-200",
        isExpanded ? "h-auto" : "h-[70px] overflow-hidden"
      )}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-0 bg-background/80 backdrop-blur-sm rounded-md pl-1">
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-muted rounded-md h-6 w-6 flex items-center justify-center">
              <MoreVertical className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setIsEditing(true); setIsExpanded(true); }}>
              <Pencil className="h-3 w-3 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setIsPromptMode(true); setIsExpanded(true); }}>
              <Copy className="h-3 w-3 mr-2" /> Use in Prompt
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(note.id)}>
              <Trash2 className="h-3 w-3 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isEditing ? (
        <div className="space-y-2 h-full flex flex-col">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 min-h-[60px] text-xs resize-none"
          />
          <div className="flex justify-end gap-2 shrink-0">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs px-2">Cancel</Button>
            <Button
              size="sm"
              className="h-7 text-xs px-2 opacity-50 cursor-not-allowed"
              disabled
              title="Available in full version"
            >
              Save
              <span className="ml-1 text-[9px] font-bold bg-amber-400 text-amber-900 rounded px-1 py-0 uppercase tracking-wide">Demo</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <p className={cn(
            "text-sm text-foreground whitespace-pre-wrap break-words pr-14",
            !isExpanded && "line-clamp-1"
          )}>
            {note.content}
          </p>

          {isPromptMode ? (
            <div className="mt-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <Select onValueChange={(val) => onUseInPrompt(note.content, val)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), "MMM d, h:mm a")}
                </span>
                <button onClick={() => setIsPromptMode(false)} className="text-xs text-muted-foreground hover:text-foreground font-medium">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-auto pt-2">
              <span className="text-xs text-muted-foreground">
                {format(new Date(note.created_at), "MMM d, h:mm a")}
              </span>
              <button
                onClick={() => { setIsPromptMode(true); setIsExpanded(true); }}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Copy className="h-3 w-3" /> Use in Prompt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MobileNotesPanel() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [notes, setNotes] = useState<SyncNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await (supabase as any)
        .from("sync_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setNotes(data);
    };
    fetchNotes();

    const channel = (supabase as any)
      .channel("dashboard:sync_items")
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_items" }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("sync_items")
        .insert({ content: newNote.trim() });
      if (error) throw error;
      setNewNote("");
      toast.success("Note saved!");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("sync_items").delete().eq("id", id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleUpdateNote = async (id: string, content: string) => {
    if (!content.trim()) return;
    try {
      const { error } = await (supabase as any).from("sync_items").update({ content: content.trim() }).eq("id", id);
      if (error) throw error;
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content: content.trim() } : n)));
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleUseInPrompt = (content: string, projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    dispatch({ type: "SET_CURRENT_PROJECT", id: projectId });
    navigate("/workspace", { state: { initialPrompt: content } });
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 border border-border bg-card shadow-sm rounded-2xl sticky top-6 h-[calc(100vh-3rem)] mr-6 overflow-hidden">
      <div className="p-4 border-b border-border shrink-0">
        <h2 className="text-lg font-bold text-foreground">Mobile Notes</h2>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
        {notes.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>No notes yet.</p>
            <p className="text-xs mt-1">Visit /mobile on your phone to add one.</p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onDelete={handleDeleteNote}
              onUpdate={handleUpdateNote}
              onUseInPrompt={handleUseInPrompt}
              projects={state.projects}
            />
          ))
        )}
      </div>

      {/* Upcoming Deadlines */}
      {state.demoMode && (
        <div className="px-4 pb-3 shrink-0">
          <UpcomingDeadlines />
        </div>
      )}

      <div className="p-4 border-t border-border shrink-0">
        <div className="relative w-full">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type a note from desktop..."
            className="w-full bg-muted rounded-lg p-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[80px] scrollbar-hide"
          />
          <button
            onClick={() => toast.info("Available in full version")}
            disabled={!newNote.trim()}
            className="absolute bottom-3 right-3 p-1 text-muted-foreground opacity-40 cursor-not-allowed disabled:opacity-20 transition-colors"
            title="Available in full version"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function ProjectGallery() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [persona, setPersona] = useState<Persona>("TPM");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [description, setDescription] = useState("");

  const sortedProjects = [...state.projects].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleCreate = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      description: description.trim(),
      persona,
      deadline: deadline ? deadline.toISOString() : undefined,
      sqap: "",
      auditResult: null,
      score: 0,
      grade: "F",
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "SET_PROJECTS", projects: [...state.projects, newProject] });
    dispatch({ type: "SET_CURRENT_PROJECT", id: newProject.id });
    setModalOpen(false);
    setProjectName("");
    setDescription("");
    setDeadline(undefined);
    navigate("/workspace");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 px-8 py-8 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm select-none">
              ⚡ DEMO MODE
            </span>
          </div>
          <a
            href="mailto:ahmadghabboun@outlook.com"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" /> Contact Us
          </a>
        </div>
        <div className="mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => state.demoMode ? toast.info("Available in full version") : setModalOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${state.demoMode ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              >
                <Plus className="h-4 w-4" /> New Project
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[260px] text-center">
              New projects are disabled in the demo version. Contact us for full access.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>

      <MobileNotesPanel />
      <WelcomeModal />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Fintech Payment Gateway"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select value={persona} onValueChange={(v) => setPersona(v as Persona)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TPM">Technical PM</SelectItem>
                  <SelectItem value="Analyst">Analyst</SelectItem>
                  <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea id="project-desc" placeholder="Describe your project in detail..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <Button className="w-full" size="lg" onClick={handleCreate}>Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
