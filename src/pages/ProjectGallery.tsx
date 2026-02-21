import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Pencil, Trash2, CalendarIcon, Send, Copy } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { Project, Persona } from "@/types/synaps";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import DashboardSidebar from "@/components/DashboardSidebar";
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
    dispatch({ type: "DELETE_PROJECT", id: project.id });
    toast.success("Project deleted");
  };

  const hasAudit = project.auditResult || project.score > 0;
  const editedDate = format(new Date(project.updatedAt), "MMM d, yyyy");

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
          <h3 className="text-lg font-bold text-foreground truncate pr-2">{project.name}</h3>
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
          <p className="text-sm font-medium text-foreground">{project.score}% Complete</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic">Not yet audited</p>
      )}

      <p className="text-xs text-muted-foreground mt-3">Edited {editedDate}</p>
    </article>
  );
}

function MobileNotesPanel() {
  const navigate = useNavigate();
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

  const handleUseInPrompt = (content: string) => {
    navigate("/workspace", { state: { initialPrompt: content } });
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 border-l border-border bg-card sticky top-0 h-screen overflow-y-auto scrollbar-hide">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground mb-3">Mobile Notes</h2>
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type a note from desktop..."
            className="flex-1 bg-muted rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[60px] scrollbar-hide"
          />
          <button
            onClick={handleSaveNote}
            disabled={isSaving || !newNote.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors self-end"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>No notes yet.</p>
            <p className="text-xs mt-1">Visit /mobile on your phone to add one.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-background border border-border rounded-xl p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap mb-2 line-clamp-4">{note.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), "MMM d, h:mm a")}
                </span>
                <button
                  onClick={() => handleUseInPrompt(note.content)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Copy className="h-3 w-3" /> Use in Prompt
                </button>
              </div>
            </div>
          ))
        )}
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
      toast.error("Project name is required");
      return;
    }
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName.trim(),
      description: description.trim(),
      persona,
      deadline: deadline?.toISOString(),
      sqap: "",
      auditResult: null,
      score: 0,
      grade: "-",
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_PROJECT", project: newProject });
    dispatch({ type: "SET_CURRENT_PROJECT", id: newProject.id });
    setModalOpen(false);
    setProjectName("");
    setPersona("TPM");
    setDeadline(undefined);
    setDescription("");
    navigate("/workspace");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 px-8 py-8 min-w-0">
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setModalOpen(true)}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none min-h-[180px]"
            aria-label="Create new project"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">New Project</span>
          </button>
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>

      <MobileNotesPanel />

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