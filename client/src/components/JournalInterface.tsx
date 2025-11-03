import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Lightbulb, Calendar } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const prompts = [
  "What challenged you today?",
  "What are you grateful for?",
  "What did you learn about yourself?",
  "What emotions did you experience?"
];

export function JournalInterface() {
  const [entry, setEntry] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
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
                    className="hover-elevate active-elevate-2 cursor-pointer"
                    data-testid={`card-entry-${prev.id}`}
                  >
                    <CardContent className="pt-4 pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold">
                          {new Date(prev.createdAt).toLocaleDateString()}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {prev.wordCount} words
                        </Badge>
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
    </div>
  );
}
