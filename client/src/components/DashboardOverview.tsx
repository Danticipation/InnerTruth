import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, BookOpen, ClipboardCheck, Flame, ArrowRight, AlertCircle, Lightbulb, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { PersonalityInsight } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  conversationCount: number;
  journalEntryCount: number;
  insightCount: number;
  streak: number;
  profileCompletion: number;
}

interface PersonalityAnalysis {
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    emotionalStability: number;
  };
  corePatterns: string[];
  blindSpots: string[];
  strengths: string[];
}

export function DashboardOverview() {
  const { toast } = useToast();
  
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: insights = [] } = useQuery<PersonalityInsight[]>({
    queryKey: ["/api/insights"],
  });

  const { data: analysis } = useQuery<PersonalityAnalysis>({
    queryKey: ["/api/analyze-personality"],
    enabled: (stats?.conversationCount ?? 0) > 0 || (stats?.journalEntryCount ?? 0) > 0,
    retry: false,
  });

  const analyzePersonalityMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/analyze-personality", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyze-personality"] });
      toast({
        title: "Analysis updated",
        description: "Your personality profile has been refreshed with the latest insights."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const blindSpots = insights.filter(i => i.insightType === "blind_spot");
  const growthOpportunities = insights.filter(i => i.insightType === "growth_opportunity");
  
  const traits = analysis?.traits || {
    openness: 50,
    conscientiousness: 50,
    extraversion: 50,
    agreeableness: 50,
    emotionalStability: 50
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card data-testid="card-profile-completion">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats?.profileCompletion || 0}%</div>
            <Progress value={stats?.profileCompletion || 0} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Keep chatting and journaling for deeper insights
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-current-streak">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {stats?.streak || 0} {(stats?.streak || 0) === 1 ? 'Day' : 'Days'}
            </div>
            <p className="text-xs text-muted-foreground">
              Keep journaling daily to maintain your streak
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-insights-discovered">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Discovered</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats?.insightCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated personality insights
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card data-testid="card-personality-score">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>Your Personality Overview</CardTitle>
            <CardDescription>
              Based on {stats?.conversationCount || 0} conversations and {stats?.journalEntryCount || 0} journal entries
            </CardDescription>
          </div>
          {((stats?.conversationCount ?? 0) > 0 || (stats?.journalEntryCount ?? 0) > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzePersonalityMutation.mutate()}
              disabled={analyzePersonalityMutation.isPending}
              data-testid="button-refresh-analysis"
            >
              <RefreshCw className={`h-4 w-4 ${analyzePersonalityMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Openness to Experience</span>
              <span className="font-semibold">{traits.openness}%</span>
            </div>
            <Progress value={traits.openness} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Conscientiousness</span>
              <span className="font-semibold">{traits.conscientiousness}%</span>
            </div>
            <Progress value={traits.conscientiousness} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Extraversion</span>
              <span className="font-semibold">{traits.extraversion}%</span>
            </div>
            <Progress value={traits.extraversion} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Agreeableness</span>
              <span className="font-semibold">{traits.agreeableness}%</span>
            </div>
            <Progress value={traits.agreeableness} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Emotional Stability</span>
              <span className="font-semibold">{traits.emotionalStability}%</span>
            </div>
            <Progress value={traits.emotionalStability} />
          </div>
          
          {analysis && analysis.corePatterns && analysis.corePatterns.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Core Patterns Detected</h4>
              <ul className="space-y-1">
                {analysis.corePatterns.slice(0, 3).map((pattern, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {pattern}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        {blindSpots.length > 0 && (
          <Card className="border-l-4 border-l-destructive" data-testid="card-recent-insight-blind-spot">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{blindSpots[0].title}</CardTitle>
                    <Badge variant="destructive" className="text-xs">New</Badge>
                  </div>
                  <CardDescription className="text-base">
                    {blindSpots[0].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-explore-blind-spot">
                Explore This <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
        
        {growthOpportunities.length > 0 && (
          <Card className="border-l-4 border-l-primary" data-testid="card-recent-insight-growth">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{growthOpportunities[0].title}</CardTitle>
                    <Badge className="text-xs">Actionable</Badge>
                  </div>
                  <CardDescription className="text-base">
                    {growthOpportunities[0].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" data-testid="button-explore-growth">
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
        
        {insights.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Start chatting and journaling to receive AI-generated personality insights
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Continue building your personality profile</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <Link href="/chat">
            <Button className="h-auto py-6 flex-col gap-2 w-full" data-testid="button-start-chat">
              <MessageSquare className="h-6 w-6" />
              <span>Start a Chat</span>
            </Button>
          </Link>
          <Link href="/journal">
            <Button className="h-auto py-6 flex-col gap-2 w-full" data-testid="button-write-journal">
              <BookOpen className="h-6 w-6" />
              <span>Write Journal Entry</span>
            </Button>
          </Link>
          <Button className="h-auto py-6 flex-col gap-2" data-testid="button-take-assessment">
            <ClipboardCheck className="h-6 w-6" />
            <span>Take Assessment</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
