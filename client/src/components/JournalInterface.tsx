import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Lightbulb, Calendar, Pencil, Trash2, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const prompts = [
  "What challenged you today?",
  "What are you grateful for?",
  "What did you learn about yourself?",
  "What emotions did you experience?"
];

export function JournalInterface() {
  const [entry, setEntry] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | null>(null);
  const { toast } = useToast();

  const { data: previousEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
  });

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      const wordCount = entry.split(/\s+/).filter(w => w).length;
      const res = await apiRequest("POST", "/api/journal-entries", {
        userId: "default-user-id",
        content: entry,
        prompt: selectedPrompt,
        wordCount
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved and analyzed."
      });
      setEntry("");
      setSelectedPrompt(null);
    }
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const wordCount = content.split(/\s+/).filter(w => w).length;
      const res = await apiRequest("PUT", `/api/journal-entries/${id}`, {
        content,
        wordCount
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      toast({
        title: "Entry updated",
        description: "Your journal entry has been updated."
      });
      setEditingEntry(null);
      setEditContent("");
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/journal-entries/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted."
      });
      setDeletingEntry(null);
    }
  });

  const handleSave = () => {
    if (!entry.trim()) return;
    saveEntryMutation.mutate();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card data-testid="card-journal-editor">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Entry
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!entry.trim() || saveEntryMutation.isPending}
                data-testid="button-save-entry"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveEntryMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="What's on your mind? Write freely about your thoughts, feelings, and experiences..."
              className="min-h-[400px] resize-none font-serif text-base"
              data-testid="textarea-journal-entry"
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span data-testid="text-word-count">{entry.split(/\s+/).filter(w => w).length} words</span>
              {selectedPrompt && (
                <Badge variant="secondary" data-testid="badge-active-prompt">
                  Prompt: {selectedPrompt}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card data-testid="card-journal-prompts">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Writing Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setEntry(entry ? entry + "\n\n" + prompt + "\n" : prompt + "\n");
                }}
                data-testid={`button-prompt-${index}`}
              >
                {prompt}
              </Button>
            ))}
          </CardContent>
        </Card>
        
        <Card data-testid="card-previous-entries">
          <CardHeader>
            <CardTitle className="text-base">Previous Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {previousEntries.map((prev) => (
                  <Card
                    key={prev.id}
                    className="hover-elevate"
                    data-testid={`card-entry-${prev.id}`}
                  >
                    <CardContent className="pt-4 pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold">
                          {new Date(prev.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {prev.wordCount} words
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingEntry(prev);
                              setEditContent(prev.content);
                            }}
                            data-testid={`button-edit-${prev.id}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingEntry(prev)}
                            data-testid={`button-delete-${prev.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {prev.content.substring(0, 100)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {previousEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No previous entries yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
            <DialogDescription>
              {editingEntry && new Date(editingEntry.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[300px] resize-none font-serif text-base"
            data-testid="textarea-edit-entry"
          />
          <div className="text-sm text-muted-foreground">
            {editContent.split(/\s+/).filter(w => w).length} words
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingEntry(null)}
              data-testid="button-cancel-edit"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingEntry && editContent.trim()) {
                  updateEntryMutation.mutate({
                    id: editingEntry.id,
                    content: editContent
                  });
                }
              }}
              disabled={!editContent.trim() || updateEntryMutation.isPending}
              data-testid="button-save-edit"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateEntryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEntry} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry from{" "}
              {deletingEntry && new Date(deletingEntry.createdAt).toLocaleDateString()}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingEntry) {
                  deleteEntryMutation.mutate(deletingEntry.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteEntryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
