import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Lightbulb, Calendar, Pencil, Trash2, X, Volume2, VolumeX } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { stripMarkdownForSpeech } from "@/lib/utils";
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
  const [speakingEntryId, setSpeakingEntryId] = useState<string | null>(null);
  const { toast } = useToast();

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({
    onStart: () => {
      // TTS started successfully
    },
    onEnd: () => {
      setSpeakingEntryId(null);
    },
    onError: (error) => {
      toast({
        title: "Speech Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
      setSpeakingEntryId(null);
    },
  });

  const { data: previousEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
  });

  const saveEntryMutation = useMutation({
    mutationFn: async (newEntry: { content: string; prompt: string | null }) => {
      const wordCount = newEntry.content.split(/\s+/).filter(w => w).length;
      return await apiRequest("POST", "/api/journal-entries", {
        userId: "default-user-id",
        content: newEntry.content,
        prompt: newEntry.prompt,
        wordCount
      });
    },
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["/api/journal-entries"] });
      const previousEntries = queryClient.getQueryData<JournalEntry[]>(["/api/journal-entries"]);
      
      if (previousEntries) {
        const optimisticEntry: JournalEntry = {
          id: "temp-" + Date.now(),
          userId: "default-user-id",
          content: newEntry.content,
          prompt: newEntry.prompt,
          wordCount: newEntry.content.split(/\s+/).filter(w => w).length,
          createdAt: new Date(),
        };
        queryClient.setQueryData<JournalEntry[]>(["/api/journal-entries"], [optimisticEntry, ...previousEntries]);
      }
      
      return { previousEntries };
    },
    onError: (err, newEntry, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(["/api/journal-entries"], context.previousEntries);
      }
      toast({
        title: "Error saving entry",
        description: "Your changes couldn't be saved. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
    },
    onSuccess: () => {
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
      return await apiRequest("PUT", `/api/journal-entries/${id}`, {
        content,
        wordCount
      });
    },
    onMutate: async (updatedEntry) => {
      await queryClient.cancelQueries({ queryKey: ["/api/journal-entries"] });
      const previousEntries = queryClient.getQueryData<JournalEntry[]>(["/api/journal-entries"]);
      
      if (previousEntries) {
        queryClient.setQueryData<JournalEntry[]>(
          ["/api/journal-entries"],
          previousEntries.map(old => 
            old.id === updatedEntry.id ? { ...old, content: updatedEntry.content } : old
          )
        );
      }
      
      return { previousEntries };
    },
    onError: (err, updatedEntry, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(["/api/journal-entries"], context.previousEntries);
      }
      toast({
        title: "Update failed",
        description: "Could not update the entry. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
    },
    onSuccess: () => {
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
      return await apiRequest("DELETE", `/api/journal-entries/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/journal-entries"] });
      const previousEntries = queryClient.getQueryData<JournalEntry[]>(["/api/journal-entries"]);
      
      if (previousEntries) {
        queryClient.setQueryData<JournalEntry[]>(
          ["/api/journal-entries"],
          previousEntries.filter(entry => entry.id !== id)
        );
      }
      
      return { previousEntries };
    },
    onError: (err, id, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(["/api/journal-entries"], context.previousEntries);
      }
      toast({
        title: "Delete failed",
        description: "Could not delete the entry. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onSuccess: () => {
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted."
      });
      setDeletingEntry(null);
    }
  });

  const handleSave = () => {
    if (!entry.trim()) return;
    saveEntryMutation.mutate({ content: entry, prompt: selectedPrompt });
  };

  const handleSpeakEntry = (entryId: string, content: string) => {
    // If clicking the same entry that's currently speaking, stop it
    if (speakingEntryId === entryId) {
      stopSpeaking();
      setSpeakingEntryId(null);
      return;
    }
    
    // Start speaking this entry
    setSpeakingEntryId(entryId);
    speak(stripMarkdownForSpeech(content), true); // Mark as user-initiated
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        <Card data-testid="card-journal-editor">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Today's Entry</span>
              <span className="sm:hidden">Entry</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!entry.trim() || saveEntryMutation.isPending}
                data-testid="button-save-entry"
              >
                <Save className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{saveEntryMutation.isPending ? "Saving..." : "Save Entry"}</span>
                <span className="sm:hidden">{saveEntryMutation.isPending ? "..." : "Save"}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="What's on your mind? Write freely about your thoughts, feelings, and experiences..."
              className="min-h-[300px] sm:min-h-100 resize-none font-serif text-sm sm:text-base"
              data-testid="textarea-journal-entry"
            />
            <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground flex-wrap gap-2">
              <span data-testid="text-word-count">{entry.split(/\s+/).filter(w => w).length} words</span>
              {selectedPrompt && (
                <Badge variant="secondary" className="text-xs" data-testid="badge-active-prompt">
                  Prompt: {selectedPrompt}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4 sm:space-y-6">
        <Card data-testid="card-journal-prompts">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Writing Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 sm:p-6">
            {prompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 sm:py-3 text-xs sm:text-sm"
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Previous Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <div className="space-y-2 sm:space-y-3">
                {previousEntries.map((prev) => (
                  <Card
                    key={prev.id}
                    className="hover-elevate"
                    data-testid={`card-entry-${prev.id}`}
                  >
                    <CardContent className="pt-3 sm:pt-4 pb-2 sm:pb-3 px-3 sm:px-4">
                      <div className="flex justify-between items-start mb-1.5 sm:mb-2 gap-2">
                        <p className="text-xs sm:text-sm font-semibold">
                          {new Date(prev.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {prev.wordCount}w
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleSpeakEntry(prev.id, prev.content)}
                            data-testid={`button-speak-${prev.id}`}
                            title={speakingEntryId === prev.id ? "Stop reading" : "Read aloud"}
                          >
                            {speakingEntryId === prev.id && isSpeaking ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8"
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
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => setDeletingEntry(prev)}
                            data-testid={`button-delete-${prev.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {prev.content.substring(0, 100)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {previousEntries.length === 0 && (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
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
