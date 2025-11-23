import { useState } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Brain, TrendingUp, Eye, Heart, Target, Lightbulb, Shield, Sparkles, RefreshCw, Loader2, Users, Zap, CheckCircle2, Volume2, VolumeX, AlertTriangle, Rocket } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useToast } from "@/hooks/use-toast";
import { stripMarkdownForSpeech } from "@/lib/utils";

type AnalysisTier = 'free' | 'standard' | 'premium';

type PersonalityReflection = {
  id: string;
  userId: string;
  tier: AnalysisTier;
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
  holyShitMoment?: string | null;
  growthLeveragePoint?: string | null;
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

const TIER_CONFIG = {
  free: {
    name: 'Starter Insights',
    price: '$0',
    sections: ['behavioralPatterns', 'growthAreas'],
    color: 'gray'
  },
  standard: {
    name: 'Deep Dive',
    price: '$9',
    sections: ['behavioralPatterns', 'emotionalPatterns', 'relationshipDynamics', 'growthAreas', 'strengths', 'blindSpots'],
    color: 'blue'
  },
  premium: {
    name: 'Devastating Truth',
    price: '$29',
    sections: ['behavioralPatterns', 'emotionalPatterns', 'relationshipDynamics', 'copingMechanisms', 'growthAreas', 'strengths', 'blindSpots', 'valuesAndBeliefs', 'therapeuticInsights'],
    color: 'primary'
  }
} as const;

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
    <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
        <div className="p-1.5 sm:p-2 rounded-md bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg sm:text-2xl font-bold truncate">{value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
        </div>
      </div>
      {description && <p className="text-xs text-muted-foreground mt-1 sm:mt-2">{description}</p>}
    </CardContent>
  </Card>
);

const LockedSectionCard = ({ 
  title, 
  description, 
  icon: Icon,
  requiredTier 
}: { 
  title: string; 
  description: string; 
  icon: any;
  requiredTier: AnalysisTier;
}) => (
  <Card className="opacity-60 border-dashed" data-testid={`card-locked-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-2" data-testid={`badge-locked-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {TIER_CONFIG[requiredTier].name} Only
            </Badge>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center py-8 text-center">
        <div className="space-y-4">
          <Rocket className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Unlock this section with {TIER_CONFIG[requiredTier].name} tier
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

function isSectionEnabled(sectionName: string, tier: AnalysisTier): boolean {
  return TIER_CONFIG[tier].sections.includes(sectionName as any);
}

export default function PersonalityReflection() {
  const [playingSection, setPlayingSection] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<AnalysisTier>('free');
  const { toast } = useToast();

  const { data: reflection, isLoading, error } = useQuery<PersonalityReflection>({
    queryKey: ["/api/personality-reflection"],
  });

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({
    onStart: () => {
      // Playing state is tracked by playingSection
    },
    onEnd: () => {
      setPlayingSection(null);
    },
    onError: (error) => {
      toast({
        title: "Speech Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
      setPlayingSection(null);
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/personality-reflection", { tier: selectedTier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personality-reflection"] });
    },
  });

  const handlePlaySection = (sectionName: string, text: string) => {
    // If this section is already playing, stop it
    if (playingSection === sectionName) {
      stopSpeaking();
      setPlayingSection(null);
      return;
    }

    // Start playing this section
    setPlayingSection(sectionName);
    speak(stripMarkdownForSpeech(text), true);
  };

  const handlePlayArchetype = () => {
    if (!reflection) return;
    const text = `
Your Comprehensive Personality Reflection.

Your Personality Archetype: ${reflection.coreTraits.archetype}.

${reflection.summary}
    `.trim();
    handlePlaySection('archetype', text);
  };

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

  // Check if error is a 404 (no reflection found yet) - treat as empty state
  const is404 = error instanceof Error && 
    (error.message.includes("404") || error.message.includes("No personality reflection found"));

  if (error && !is404) {
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
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          <div className="text-center space-y-4">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Generate Your Comprehensive Personality Reflection</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose your analysis depth. Each tier uses professional psychological frameworks to reveal deeper insights about your personality.
            </p>
          </div>

          {/* Tier Selection Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {(['free', 'standard', 'premium'] as const).map((tier) => {
              const config = TIER_CONFIG[tier];
              const isSelected = selectedTier === tier;
              
              return (
                <Card 
                  key={tier}
                  className={`relative cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedTier(tier)}
                  data-testid={`card-tier-${tier}`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="bg-primary" data-testid={`badge-selected-${tier}`}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span data-testid={`text-tier-name-${tier}`}>{config.name}</span>
                      <Badge variant={tier === 'free' ? 'secondary' : 'default'} data-testid={`badge-price-${tier}`}>
                        {config.price}
                      </Badge>
                    </CardTitle>
                    <CardDescription data-testid={`text-tier-sections-${tier}`}>
                      {config.sections.length} analysis sections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground space-y-1">
                      {tier === 'free' && (
                        <>
                          <p>• Behavioral Patterns</p>
                          <p>• Growth Areas</p>
                        </>
                      )}
                      {tier === 'standard' && (
                        <>
                          <p>• Everything in Free</p>
                          <p>• Emotional Patterns</p>
                          <p>• Relationship Dynamics</p>
                          <p>• Strengths & Blind Spots</p>
                        </>
                      )}
                      {tier === 'premium' && (
                        <>
                          <p>• Everything in Standard</p>
                          <p>• Coping Mechanisms</p>
                          <p>• Values & Beliefs</p>
                          <p>• Therapeutic Insights</p>
                          <p className="font-semibold text-primary">• Holy Shit Moment ✨</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button 
              onClick={() => generateMutation.mutate()}
              size="lg"
              className="mt-6"
              data-testid="button-generate-reflection"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate {TIER_CONFIG[selectedTier].name} Analysis
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Analyzes all your conversations, journals, moods, and memories using AI
            </p>
          </div>
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

  // Check if user has a lower tier and might want to upgrade
  const canUpgrade = reflection.tier === 'free' || reflection.tier === 'standard';

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 sm:mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" data-testid="text-reflection-title">
                Your Comprehensive Personality Reflection
              </h1>
              <Badge variant="default" className="hidden sm:inline-flex" data-testid="badge-current-tier">
                {TIER_CONFIG[reflection.tier].name}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Generated {new Date(reflection.createdAt).toLocaleDateString()} • Deep AI Analysis
            </p>
          </div>
          <div className="flex gap-2">
            {canUpgrade && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="default"
                    size="sm"
                    className="sm:size-default w-full sm:w-auto"
                    data-testid="button-upgrade-tier"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Personality Analysis</DialogTitle>
                    <DialogDescription>
                      Choose a deeper level of analysis to unlock more insights
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    {(['free', 'standard', 'premium'] as const).map((tier) => {
                      const config = TIER_CONFIG[tier];
                      const isSelected = selectedTier === tier;
                      const isCurrent = reflection.tier === tier;
                      
                      return (
                        <Card 
                          key={tier}
                          className={`relative cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-primary' : ''
                          } ${isCurrent ? 'opacity-60' : ''}`}
                          onClick={() => !isCurrent && setSelectedTier(tier)}
                          data-testid={`card-tier-${tier}`}
                        >
                          {isCurrent && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <Badge variant="secondary" data-testid={`badge-current-${tier}`}>
                                Current Tier
                              </Badge>
                            </div>
                          )}
                          {isSelected && !isCurrent && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <Badge variant="default" className="bg-primary" data-testid={`badge-selected-${tier}`}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Selected
                              </Badge>
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                              <span data-testid={`text-tier-name-${tier}`}>{config.name}</span>
                              <Badge variant={tier === 'free' ? 'secondary' : 'default'} data-testid={`badge-price-${tier}`}>
                                {config.price}
                              </Badge>
                            </CardTitle>
                            <CardDescription data-testid={`text-tier-sections-${tier}`}>
                              {config.sections.length} analysis sections
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-xs text-muted-foreground space-y-1">
                              {tier === 'free' && (
                                <>
                                  <p>• Behavioral Patterns</p>
                                  <p>• Growth Areas</p>
                                </>
                              )}
                              {tier === 'standard' && (
                                <>
                                  <p>• Everything in Free</p>
                                  <p>• Emotional Patterns</p>
                                  <p>• Relationship Dynamics</p>
                                  <p>• Strengths & Blind Spots</p>
                                </>
                              )}
                              {tier === 'premium' && (
                                <>
                                  <p>• Everything in Standard</p>
                                  <p>• Coping Mechanisms</p>
                                  <p>• Values & Beliefs</p>
                                  <p>• Therapeutic Insights</p>
                                  <p className="font-semibold text-primary">• Holy Shit Moment ✨</p>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <DialogClose asChild>
                      <Button variant="outline" data-testid="button-cancel-upgrade">
                        Cancel
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button 
                        onClick={() => generateMutation.mutate()}
                        disabled={selectedTier === reflection.tier}
                        data-testid="button-confirm-upgrade"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate {TIER_CONFIG[selectedTier].name} Analysis
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button 
              onClick={() => generateMutation.mutate()}
              variant="outline"
              size="sm"
              className="sm:size-default w-full sm:w-auto"
              data-testid="button-refresh-reflection"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                <div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Your Personality Archetype</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Core identity and essence</CardDescription>
                </div>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'archetype' ? "default" : "ghost"}
                onClick={handlePlayArchetype}
                data-testid="button-play-archetype"
                title={playingSection === 'archetype' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'archetype' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <Badge variant="outline" className="text-sm sm:text-base md:text-lg px-3 sm:px-4 py-1.5 sm:py-2">
              {reflection.coreTraits.archetype}
            </Badge>
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {reflection.summary}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
              {reflection.coreTraits.dominantTraits.map((trait, i) => (
                <Badge key={i} variant="secondary" className="text-xs sm:text-sm">{trait}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Big 5 Personality Traits */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              Big 5 Personality Traits
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Scientific personality dimensions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Behavioral Patterns
                </CardTitle>
                <CardDescription>How you act and react in the world</CardDescription>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'behavioral' ? "default" : "ghost"}
                onClick={() => handlePlaySection('behavioral', `Behavioral Patterns:\n${reflection.behavioralPatterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}`)}
                data-testid="button-play-behavioral"
                title={playingSection === 'behavioral' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'behavioral' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Emotional Patterns
                </CardTitle>
                <CardDescription>How you process and express feelings</CardDescription>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'emotional' ? "default" : "ghost"}
                onClick={() => handlePlaySection('emotional', `Emotional Patterns:\n${reflection.emotionalPatterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}`)}
                data-testid="button-play-emotional"
                title={playingSection === 'emotional' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'emotional' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Relationship Dynamics
                </CardTitle>
                <CardDescription>How you connect with others</CardDescription>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'relationships' ? "default" : "ghost"}
                onClick={() => handlePlaySection('relationships', `Relationship Dynamics:\n${reflection.relationshipDynamics.map((d, i) => `${i + 1}. ${d}`).join('\n')}`)}
                data-testid="button-play-relationships"
                title={playingSection === 'relationships' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'relationships' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Coping Mechanisms
                </CardTitle>
                <CardDescription>How you handle stress and challenges</CardDescription>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'coping' ? "default" : "ghost"}
                onClick={() => handlePlaySection('coping', `Coping Mechanisms:\n${reflection.copingMechanisms.map((m, i) => `${i + 1}. ${m}`).join('\n')}`)}
                data-testid="button-play-coping"
                title={playingSection === 'coping' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'coping' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Strengths */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                    Strengths
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your superpowers</CardDescription>
                </div>
                <Button
                  size="icon"
                  variant={playingSection === 'strengths' ? "default" : "ghost"}
                  onClick={() => handlePlaySection('strengths', `Strengths:\n${reflection.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)}
                  data-testid="button-play-strengths"
                  title={playingSection === 'strengths' ? "Stop reading" : "Read aloud"}
                >
                  {playingSection === 'strengths' && isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-1.5 sm:space-y-2">
                {reflection.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Blind Spots */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    Blind Spots
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">What you can't see about yourself</CardDescription>
                </div>
                <Button
                  size="icon"
                  variant={playingSection === 'blindspots' ? "default" : "ghost"}
                  onClick={() => handlePlaySection('blindspots', `Blind Spots:\n${reflection.blindSpots.map((b, i) => `${i + 1}. ${b}`).join('\n')}`)}
                  data-testid="button-play-blindspots"
                  title={playingSection === 'blindspots' ? "Stop reading" : "Read aloud"}
                >
                  {playingSection === 'blindspots' && isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-1.5 sm:space-y-2">
                {reflection.blindSpots.map((spot, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="text-yellow-500 font-bold shrink-0">•</span>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Growth Areas
                </CardTitle>
                <CardDescription>Opportunities for development</CardDescription>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'growth' ? "default" : "ghost"}
                onClick={() => handlePlaySection('growth', `Growth Areas:\n${reflection.growthAreas.map((a, i) => `${i + 1}. ${a}`).join('\n')}`)}
                data-testid="button-play-growth"
                title={playingSection === 'growth' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'growth' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Values & Beliefs
                </CardTitle>
                <CardDescription>What drives your decisions</CardDescription>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'values' ? "default" : "ghost"}
                onClick={() => handlePlaySection('values', `Values and Beliefs:\n${reflection.valuesAndBeliefs.map((v, i) => `${i + 1}. ${v}`).join('\n')}`)}
                data-testid="button-play-values"
                title={playingSection === 'values' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'values' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Therapeutic Insights
                </CardTitle>
                <CardDescription>Deep psychological observations</CardDescription>
              </div>
              <Button
                size="icon"
                variant={playingSection === 'therapeutic' ? "default" : "ghost"}
                onClick={() => handlePlaySection('therapeutic', `Therapeutic Insights:\n${reflection.therapeuticInsights.map((t, i) => `${i + 1}. ${t}`).join('\n')}`)}
                data-testid="button-play-therapeutic"
                title={playingSection === 'therapeutic' ? "Stop reading" : "Read aloud"}
              >
                {playingSection === 'therapeutic' && isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
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

        {/* Holy Shit Moment - THE core revelation */}
        {reflection.holyShitMoment && (
          <Card className="border-2 border-red-500/30 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    The Core Truth
                  </CardTitle>
                  <CardDescription>The organizing principle behind your patterns</CardDescription>
                </div>
                <Button
                  size="icon"
                  variant={playingSection === 'holyshit' ? "default" : "ghost"}
                  onClick={() => handlePlaySection('holyshit', `The Core Truth:\n${reflection.holyShitMoment}`)}
                  data-testid="button-play-holyshit"
                  title={playingSection === 'holyshit' ? "Stop reading" : "Read aloud"}
                >
                  {playingSection === 'holyshit' && isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-md bg-red-500/10 border border-red-500/30">
                <p className="text-base leading-relaxed font-medium">{reflection.holyShitMoment}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                This insight connects the underlying patterns across all your behavioral, emotional, and relational dynamics.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Growth Leverage Point - THE actionable intervention */}
        {reflection.growthLeveragePoint && (
          <Card className="border-2 border-green-500/30 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-green-500" />
                    Your Growth Leverage Point
                  </CardTitle>
                  <CardDescription>The counter-intuitive action that will move the needle</CardDescription>
                </div>
                <Button
                  size="icon"
                  variant={playingSection === 'leverage' ? "default" : "ghost"}
                  onClick={() => handlePlaySection('leverage', `Your Growth Leverage Point:\n${reflection.growthLeveragePoint}`)}
                  data-testid="button-play-leverage"
                  title={playingSection === 'leverage' ? "Stop reading" : "Read aloud"}
                >
                  {playingSection === 'leverage' && isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-md bg-green-500/10 border border-green-500/30">
                <p className="text-base leading-relaxed font-medium">{reflection.growthLeveragePoint}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                This action directly targets your core pattern - not generic advice, but a specific intervention tailored to you.
              </p>
            </CardContent>
          </Card>
        )}

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
