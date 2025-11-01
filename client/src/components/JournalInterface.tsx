import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Lightbulb, Calendar } from "lucide-react";

const prompts = [
  "What challenged you today?",
  "What are you grateful for?",
  "What did you learn about yourself?",
  "What emotions did you experience?"
];

const previousEntries = [
  {
    id: "1",
    date: "Nov 1, 2024",
    preview: "Today I realized that I've been avoiding difficult conversations with my team. It's easier to...",
    wordCount: 342
  },
  {
    id: "2",
    date: "Oct 31, 2024",
    preview: "Reflecting on my relationship patterns, I notice I tend to be the one who always compromises...",
    wordCount: 289
  },
  {
    id: "3",
    date: "Oct 30, 2024",
    preview: "Had an interesting insight during meditation. I keep saying yes to things I don't want to do...",
    wordCount: 412
  }
];

export function JournalInterface() {
  const [entry, setEntry] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handleSave = () => {
    console.log("Saving journal entry:", entry);
    setEntry("");
    setSelectedPrompt(null);
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
                variant="outline"
                size="sm"
                onClick={() => console.log("Draft saved")}
                data-testid="button-save-draft"
              >
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!entry.trim()}
                data-testid="button-save-entry"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Entry
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
                        <p className="text-sm font-semibold">{prev.date}</p>
                        <Badge variant="secondary" className="text-xs">
                          {prev.wordCount} words
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {prev.preview}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
