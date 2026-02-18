import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { Project, Persona } from "@/types/synaps";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Updated today";
  if (days === 1) return "Last updated: 1 day ago";
  return `Last updated: ${days} days ago`;
}

function scoreColor(score: number) {
  if (score >= 80) return "from-success to-success/80";
  if (score >= 60) return "from-primary to-primary/80";
  if (score >= 40) return "from-warning to-warning/80";
  return "from-destructive to-destructive/80";
}

function scoreTextColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-warning";
  return "text-destructive";
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

  return (
    <article
      className="group relative bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
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
      <div className="flex items-start justify-between mb-2">
        {isRenaming ? (
          <input
            className="text-xl font-bold text-foreground bg-transparent border-b-2 border-primary outline-none w-full mr-2"
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
          <h3 className="text-xl font-bold text-foreground pr-2">{project.name}</h3>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
              aria-label="Project options"
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
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

      <p className="text-sm text-muted-foreground mb-4">{timeAgo(project.updatedAt)}</p>

      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scoreColor(project.score)} transition-all duration-500`}
          style={{ width: `${project.score}%` }}
        />
      </div>

      <p className={`text-3xl font-bold mt-3 ${scoreTextColor(project.score)}`}>
        {project.score}%
      </p>
    </article>
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
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-8">
          <p className="text-sm text-muted-foreground mb-2 tracking-wide">
            SYNAPS | Project Quality Assurance Intelligence
          </p>
          <h1 className="text-4xl font-bold text-foreground">Project Gallery</h1>
        </header>

        {/* Hero Create Card */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full bg-card rounded-2xl border-2 border-dashed border-border p-16 flex flex-col items-center justify-center hover:border-primary hover:border-solid transition-all duration-300 hover:scale-[1.01] group focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Create new project"
        >
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Plus className="h-10 w-10 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground mt-4">Create New Project</span>
        </button>

        {/* Recent Projects */}
        {state.projects.length > 0 && (
          <section className="mt-12" aria-label="Recent projects">
            <h2 className="text-2xl font-bold text-foreground mb-6">Recent Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Project Setup Modal */}
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea
                id="project-desc"
                placeholder="Describe your project in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <Button className="w-full" size="lg" onClick={handleCreate}>
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
