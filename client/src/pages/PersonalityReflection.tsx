import { DashboardNav } from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, Eye, Heart, Target, Lightbulb, Shield, Sparkles, RefreshCw, Loader2, Users, Zap, CheckCircle2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

type PersonalityReflection = {
  id: string;
  userId: string;
  summary: string;
  coreTraits: {
    big5: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      emotionalStability: number;
    };
    archetype: string;
    dominantTraits: string[];
  };
  behavioralPatterns: string[];
  emotionalPatterns: string[];
  relationshipDynamics: string[];
  copingMechanisms: string[];
  growthAreas: string[];
  strengths: string[];
  blindSpots: string[];
  valuesAndBeliefs: string[];
  therapeuticInsights: string[];
  statistics: {
    totalConversations: number;
    totalJournalEntries: number;
    totalMoodEntries: number;
    totalMemoryFacts: number;
    averageMoodScore: number;
    journalStreak: number;
    mostCommonEmotions: string[];
    mostActiveCategories: string[];
    engagementScore: number;
  };
  createdAt: Date;
};

const Big5TraitBar = ({ label, value }: { label: string; value: number }) => {
  const getColor = (val: number) => {
    if (val >= 75) return "bg-primary";
    if (val >= 50) return "bg-blue-500";
    if (val >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{value}/100</span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-secondary overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${getColor(value)} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, description }: { icon: any; label: string; value: string | number; description?: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
      {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
    </CardContent>
  </Card>
);

export default function PersonalityReflection() {
  const { data: reflection, isLoading, error } = useQuery<PersonalityReflection>({
    queryKey: ["/api/personality-reflection"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/personality-reflection", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personality-reflection"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load personality reflection";
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Card className="border-destructive">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="text-destructive text-4xl mb-4">⚠</div>
                <h2 className="text-2xl font-bold">Error Loading Reflection</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{errorMessage}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mt-4"
                  data-testid="button-retry-load"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (generateMutation.isError) {
    const errorMessage = generateMutation.error instanceof Error 
      ? generateMutation.error.message 
      : "Failed to generate personality reflection";
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Card className="border-destructive">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="text-destructive text-4xl mb-4">⚠</div>
                <h2 className="text-2xl font-bold">Error Generating Reflection</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{errorMessage}</p>
                <p className="text-sm text-muted-foreground">
                  Make sure you have enough data: conversations, journal entries, and mood entries.
                </p>
                <Button 
                  onClick={() => generateMutation.reset()}
                  variant="outline"
                  className="mt-4"
                  data-testid="button-retry-generate"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!reflection && !generateMutation.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Card className="border-2 border-dashed">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Generate Your Comprehensive Personality Reflection</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Get an incredibly detailed, therapeutic-grade analysis of your personality, patterns, and growth opportunities. This analysis synthesizes all your conversations, journal entries, mood data, and extracted memories.
                </p>
                <Button 
                  onClick={() => generateMutation.mutate()}
                  size="lg"
                  className="mt-6"
                  data-testid="button-generate-reflection"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Comprehensive Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (generateMutation.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Analyzing Your Personality...</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Processing {reflection?.statistics.totalConversations || 0} conversations, {reflection?.statistics.totalJournalEntries || 0} journal entries, 
                  and {reflection?.statistics.totalMemoryFacts || 0} extracted facts to create your comprehensive profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!reflection) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" data-testid="text-reflection-title">
              Your Comprehensive Personality Reflection
            </h1>
            <p className="text-muted-foreground">
              Generated {new Date(reflection.createdAt).toLocaleDateString()} • Deep AI Analysis
            </p>
          </div>
          <Button 
            onClick={() => generateMutation.mutate()}
            variant="outline"
            data-testid="button-refresh-reflection"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={Brain}
            label="Engagement Score"
            value={`${reflection.statistics.engagementScore}/100`}
            description="Your interaction depth"
          />
          <StatCard 
            icon={TrendingUp}
            label="Journal Streak"
            value={`${reflection.statistics.journalStreak} days`}
            description="Consecutive days"
          />
          <StatCard 
            icon={Heart}
            label="Avg Mood"
            value={reflection.statistics.averageMoodScore.toFixed(1)}
            description="Out of 10"
          />
          <StatCard 
            icon={Lightbulb}
            label="Memory Facts"
            value={reflection.statistics.totalMemoryFacts}
            description="Extracted insights"
          />
        </div>

        {/* Archetype & Summary */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">Your Personality Archetype</CardTitle>
                <CardDescription>Core identity and essence</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {reflection.coreTraits.archetype}
            </Badge>
            <p className="text-base leading-relaxed whitespace-pre-line">
              {reflection.summary}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {reflection.coreTraits.dominantTraits.map((trait, i) => (
                <Badge key={i} variant="secondary">{trait}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Big 5 Personality Traits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Big 5 Personality Traits
            </CardTitle>
            <CardDescription>Scientific personality dimensions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Big5TraitBar label="Openness" value={reflection.coreTraits.big5.openness} />
            <Big5TraitBar label="Conscientiousness" value={reflection.coreTraits.big5.conscientiousness} />
            <Big5TraitBar label="Extraversion" value={reflection.coreTraits.big5.extraversion} />
            <Big5TraitBar label="Agreeableness" value={reflection.coreTraits.big5.agreeableness} />
            <Big5TraitBar label="Emotional Stability" value={reflection.coreTraits.big5.emotionalStability} />
          </CardContent>
        </Card>

        {/* Behavioral Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Behavioral Patterns
            </CardTitle>
            <CardDescription>How you act and react in the world</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reflection.behavioralPatterns.map((pattern, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{pattern}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Emotional Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Emotional Patterns
            </CardTitle>
            <CardDescription>How you process and express feelings</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reflection.emotionalPatterns.map((pattern, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                  <Heart className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{pattern}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Relationship Dynamics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Relationship Dynamics
            </CardTitle>
            <CardDescription>How you connect with others</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reflection.relationshipDynamics.map((dynamic, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                  <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{dynamic}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Coping Mechanisms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Coping Mechanisms
            </CardTitle>
            <CardDescription>How you handle stress and challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reflection.copingMechanisms.map((mechanism, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{mechanism}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Strengths
              </CardTitle>
              <CardDescription>Your superpowers</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {reflection.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Blind Spots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Blind Spots
              </CardTitle>
              <CardDescription>What you can't see about yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {reflection.blindSpots.map((spot, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span>{spot}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Growth Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Areas
            </CardTitle>
            <CardDescription>Opportunities for development</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reflection.growthAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                  <TrendingUp className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Values & Beliefs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Values & Beliefs
            </CardTitle>
            <CardDescription>What drives your decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {reflection.valuesAndBeliefs.map((value, i) => (
                <li key={i} className="flex items-start gap-2 text-sm p-2 rounded-md bg-secondary/30">
                  <span className="text-primary font-bold">→</span>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Therapeutic Insights */}
        <Card className="border-2 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Therapeutic Insights
            </CardTitle>
            <CardDescription>Deep psychological observations</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {reflection.therapeuticInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-md bg-purple-500/5 border border-purple-500/20">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300">
                    {i + 1}
                  </div>
                  <span className="text-sm leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-sm">Analysis Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="font-semibold mb-1">Conversations</p>
                <p className="text-muted-foreground">{reflection.statistics.totalConversations} total</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Journal Entries</p>
                <p className="text-muted-foreground">{reflection.statistics.totalJournalEntries} total</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Mood Entries</p>
                <p className="text-muted-foreground">{reflection.statistics.totalMoodEntries} total</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Memory Facts</p>
                <p className="text-muted-foreground">{reflection.statistics.totalMemoryFacts} extracted</p>
              </div>
            </div>
            {reflection.statistics.mostCommonEmotions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold mb-2">Most Common Emotions</p>
                <div className="flex flex-wrap gap-1">
                  {reflection.statistics.mostCommonEmotions.map((emotion, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{emotion}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
