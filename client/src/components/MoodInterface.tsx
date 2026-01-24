import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Smile, Meh, Frown, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MoodEntry, InsertMoodEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const COMMON_MOODS = [
  { label: "Happy", emoji: "😊", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { label: "Sad", emoji: "😢", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { label: "Anxious", emoji: "😰", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  { label: "Angry", emoji: "😠", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  { label: "Calm", emoji: "😌", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  { label: "Excited", emoji: "🤩", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  { label: "Tired", emoji: "😴", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { label: "Stressed", emoji: "😫", color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300" },
];

const COMMON_ACTIVITIES = [
  "Work", "Exercise", "Social", "Family", "Hobbies", "Rest", "Study", "Errands"
];

export function MoodInterface() {
  const [selectedMood, setSelectedMood] = useState("");
  const [intensity, setIntensity] = useState([50]);
  const [activities, setActivities] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const { data: moodEntries = [], isLoading } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });

  const createMoodMutation = useMutation({
    mutationFn: async (entry: InsertMoodEntry) => {
      return await apiRequest("POST", "/api/mood-entries", entry);
    },
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["/api/mood-entries"] });
      const previousMoods = queryClient.getQueryData<MoodEntry[]>(["/api/mood-entries"]);

      if (previousMoods) {
        const optimisticEntry: MoodEntry = {
          id: "temp-" + Date.now(),
          userId: "default-user-id",
          mood: newEntry.mood,
          intensity: newEntry.intensity,
          activities: newEntry.activities || null,
          note: newEntry.note || null,
          createdAt: new Date(),
        };
        queryClient.setQueryData<MoodEntry[]>(["/api/mood-entries"], [optimisticEntry, ...previousMoods]);
      }

      return { previousMoods };
    },
    onError: (err, newEntry, context) => {
      if (context?.previousMoods) {
        queryClient.setQueryData(["/api/mood-entries"], context.previousMoods);
      }
      toast({
        title: "Error",
        description: "Failed to log mood. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personality-reflection"] });
    },
    onSuccess: () => {
      setSelectedMood("");
      setIntensity([50]);
      setActivities([]);
      setNote("");
      toast({
        title: "Mood Logged",
        description: "Your mood has been tracked successfully.",
      });
    },
  });

  const handleSave = () => {
    if (!selectedMood) {
      toast({
        title: "Select a Mood",
        description: "Please select how you're feeling.",
        variant: "destructive",
      });
      return;
    }

    createMoodMutation.mutate({
      mood: selectedMood,
      intensity: intensity[0],
      activities: activities.length > 0 ? activities : undefined,
      note: note.trim() || undefined,
    });
  };

  const toggleActivity = (activity: string) => {
    setActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const getIntensityIcon = () => {
    if (intensity[0] <= 33) return <Frown className="h-5 w-5 text-muted-foreground" />;
    if (intensity[0] <= 66) return <Meh className="h-5 w-5 text-muted-foreground" />;
    return <Smile className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Log New Mood Card */}
      <Card data-testid="card-log-mood">
        <CardHeader>
          <CardTitle>How are you feeling?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Selection */}
          <div className="space-y-3">
            <Label>Select Your Mood</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMMON_MOODS.map(mood => (
                <Button
                  key={mood.label}
                  variant={selectedMood === mood.label ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-3"
                  onClick={() => setSelectedMood(mood.label)}
                  data-testid={`button-mood-${mood.label.toLowerCase()}`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Intensity</Label>
              <div className="flex items-center gap-2">
                {getIntensityIcon()}
                <span className="text-sm font-medium">{intensity[0]}%</span>
              </div>
            </div>
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              min={0}
              max={100}
              step={5}
              data-testid="slider-intensity"
            />
          </div>

          {/* Activities */}
          <div className="space-y-3">
            <Label>What are you doing? (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ACTIVITIES.map(activity => (
                <Badge
                  key={activity}
                  variant={activities.includes(activity) ? "default" : "outline"}
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => toggleActivity(activity)}
                  data-testid={`badge-activity-${activity.toLowerCase()}`}
                >
                  {activity}
                </Badge>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-3">
            <Label htmlFor="note">Add a Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="What's on your mind?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="textarea-mood-note"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSave}
            className="w-full gap-2"
            disabled={createMoodMutation.isPending}
            data-testid="button-save-mood"
          >
            <Plus className="h-4 w-4" />
            {createMoodMutation.isPending ? "Logging..." : "Log Mood"}
          </Button>
        </CardContent>
      </Card>

      {/* Mood History Card */}
      <Card data-testid="card-mood-history">
        <CardHeader>
          <CardTitle>Recent Moods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading moods...
            </div>
          ) : moodEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Meh className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No mood entries yet</p>
              <p className="text-xs mt-1">Start tracking your moods to see patterns</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {moodEntries.map(entry => {
                const moodData = COMMON_MOODS.find(m => m.label === entry.mood);
                return (
                  <div
                    key={entry.id}
                    className="p-4 border rounded-lg space-y-2 hover-elevate"
                    data-testid={`mood-entry-${entry.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{moodData?.emoji || "😐"}</span>
                        <div>
                          <p className="font-medium">{entry.mood}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" data-testid={`badge-intensity-${entry.id}`}>
                        {entry.intensity}%
                      </Badge>
                    </div>

                    {entry.activities && entry.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.activities.map((activity, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {entry.note && (
                      <p className="text-sm text-muted-foreground pt-2 border-t">
                        {entry.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
