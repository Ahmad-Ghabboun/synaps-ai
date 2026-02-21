import React, { useState, useEffect } from "react";
import synapsWordmark from "@/assets/synaps-wordmark.png";
import { Plus, Trash2, Send, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SyncNote {
  id: string;
  content: string;
  created_at: string;
}

function NoteWidget({ note, onDelete }: { note: SyncNote; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.content.length > 100;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <p className={`text-sm text-foreground whitespace-pre-wrap ${!expanded && isLong ? "line-clamp-3" : ""}`}>
        {note.content}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary mt-1"
        >
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show more</>}
        </button>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">
          {format(new Date(note.created_at), "MMM d, h:mm a")}
        </span>
        <button
          onClick={() => onDelete(note.id)}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

export default function MobileSync() {
  const [notes, setNotes] = useState<SyncNote[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      .channel("mobile:sync_items")
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_items" }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSave = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("sync_items")
        .insert({ content: inputText.trim() });
      if (error) throw error;
      setInputText("");
      setModalOpen(false);
      toast.success("Note saved!");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await (supabase as any).from("sync_items").delete().eq("id", id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <div className="bg-card border-b border-border px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <img src={synapsWordmark} alt="SYNAPS" className="h-8 object-contain" />
        <span className="text-sm text-muted-foreground font-medium">Notes</span>
      </div>

      <div className="flex-1 px-4 py-6 space-y-3 pb-28">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-muted-foreground">
            <p className="text-sm">No notes yet.</p>
            <p className="text-xs mt-1">Tap + to create your first note.</p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteWidget key={note.id} note={note} onDelete={handleDelete} />
          ))
        )}
      </div>

      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-20"
      >
        <Plus className="h-6 w-6" />
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-card w-full rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">New Note</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your note..."
              className="w-full bg-muted rounded-xl p-4 text-foreground text-sm outline-none resize-none min-h-[140px] placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={isLoading || !inputText.trim()}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}