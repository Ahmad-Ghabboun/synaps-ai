import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Clock, ArrowRight, Copy } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { state, updateCurrentProject } = useApp();
  const [notes, setNotes] = useState<any[]>([]);

  // Sort projects: Newest created first (Newest -> Oldest)
const sortedProjects = [...state.projects].sort((a, b) => {
  const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
  const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
  return dateB - dateA;
});

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
  .channel("public:sync_items")
  .on(
    "postgres_changes",
        { event: "INSERT", schema: "public", table: "sync_items" },
        (payload) => {
          setNotes((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleProjectClick = (project: any) => {
    updateCurrentProject(project);
    navigate("/workspace");
  };

  const handleUseInPrompt = (text: string) => {
    navigate("/workspace", { state: { initialPrompt: text } });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 p-6 md:p-12 min-w-0">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-lg text-muted-foreground mt-2">Manage your quality assurance projects</p>
            </div>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map((project) => (
              <div 
                key={project.id} 
                className="group bg-card rounded-xl border border-border shadow-sm p-6 hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden"
                onClick={() => handleProjectClick(project)}
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    {project.deadline && (
                      <Badge variant="outline" className="shrink-0 bg-orange-50 text-orange-600 border-orange-100">
                        {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Badge>
                    )}
                  </div>
                  {project.grade && (
                    <Badge variant="outline" className={`shrink-0 ${
                      project.grade === 'A' ? 'bg-green-500/10 text-green-600 border-green-200' : 
                      project.grade === 'B' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                      project.grade === 'F' ? 'bg-red-500/10 text-red-600 border-red-200' : ''
                    }`}>
                      Grade {project.grade}
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
                  {project.description || "No description provided."}
                </p>
                
                <div className="flex flex-col gap-2 mt-auto">
                  {project.deadline && (
                    <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-none gap-1.5 py-1 px-2.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-semibold">
                        {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Edited {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="w-80 border-l border-border bg-card p-4 hidden xl:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 text-foreground">Mobile Notes</h2>
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="p-3 rounded-lg border border-border bg-background">
              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap line-clamp-6">{note.content}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => handleUseInPrompt(note.content)}>
                <Copy className="h-3 w-3 mr-2" /> Use in Prompt
              </Button>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No notes yet. Visit /mobile to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
