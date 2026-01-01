import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  BookOpen,
  ClipboardCheck,
  Flame,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Target,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PersonalityInsight, UserSelectedCategory, CategoryInsight } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CategoryTrendChart } from "@/components/CategoryTrendChart";

interface Stats {
  conversationCount: number;
  journalEntryCount: number;
  insightCount: number;
  streak: number;
  profileCompletion: number;
}

interface PersonalityReflection {
  id: string;
  userId: string;
  tier: "free" | "standard" | "premium";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  currentSection: string | null;
  errorMessage: string | null;
  summary: string;
  coreTraits: {
    big5?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    archetype?: string;
    dominantTraits?: string[];
  };
  behavioralPatterns: string[];
  strengths: string[];
  blindSpots: string[];
  createdAt?: string;
  updatedAt?: string;
}

function CategorySection({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const { data: weeklyScoreData } = useQuery<any[]>({
    queryKey: [`/api/category-scores/${categoryId}?period=weekly&limit=1`],
  });

  const { data: insights = [] } = useQuery<CategoryInsight[]>({
    queryKey: [`/api/category-insights/${categoryId}`],
  });

  const latestWeeklyScore = weeklyScoreData?.[0];
  const latestInsight = insights[0];

  return (
    <div className="space-y-4" data-testid={`div-category-section-${categoryId}`}>
      {/* Trend Chart */}
      <CategoryTrendChart categoryId={categoryId} categoryName={categoryName} />

      {/* Weekly Score Summary */}
      {latestWeeklyScore && (
        <Card data-testid={`card-weekly-summary-${categoryId}`}>
          <CardHeader>
            <CardTitle className="text-lg">This Week&apos;s Performance</CardTitle>
            <CardDescription>Weekly score for {categoryName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-primary mb-1">
                  {latestWeeklyScore.score}
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <Badge variant={latestWeeklyScore.confidenceLevel === "high" ? "default" : "secondary"}>
                  {latestWeeklyScore.confidenceLevel} confidence
                </Badge>
              </div>

              {latestWeeklyScore.reasoning && (
                <div className="flex-1 ml-6">
                  <p className="text-sm text-muted-foreground">{latestWeeklyScore.reasoning}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {latestInsight && (
        <Card data-testid={`card-key-insights-${categoryId}`}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Key Insights</CardTitle>
                <CardDescription>{latestInsight.timeframe}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-3">{latestInsight.summary}</p>

              {latestInsight.keyPatterns && latestInsight.keyPatterns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Patterns Detected:</h4>
                  <ul className="space-y-1">
                    {latestInsight.keyPatterns.map((pattern, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestInsight.recommendedActions && latestInsight.recommendedActions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold">Recommended Actions:</h4>
                  <ul className="space-y-1">
                    {latestInsight.recommendedActions.map((action, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function DashboardOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  // Insights (existing)
  const { data: insights = [] } = useQuery<PersonalityInsight[]>({
    queryKey: ["/api/insights"],
  });

  // Categories (existing)
  const { data: userCategories = [] } = useQuery<UserSelectedCategory[]>({
    queryKey: ["/api/user-categories"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // ✅ Reflection: single source of truth
  const {
    data: reflection,
    isLoading: reflectionLoading,
    error: reflectionError,
  } = useQuery<PersonalityReflection>({
    queryKey: ["/api/personality-reflection/latest"],
    enabled: true,
    retry: false,
  });

  // Determine if reflection is missing vs actual error
  const reflectionNotFound =
    (reflectionError as any)?.status === 404 ||
    (reflectionError as any)?.response?.status === 404 ||
    String((reflectionError as any)?.message || "").includes("404");

  // Generate/Update profile
  const generateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/personality-reflection", { tier: "free" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personality-reflection/latest"] });
      toast({
        title: "Profile generation started",
        description: "We’re updating your InnerTruth profile in the background.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Profile generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Poll reflection while it's generating
  useEffect(() => {
    if (!reflection) return;

    const active = reflection.status === "pending" || reflection.status === "processing";
    if (!active) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/personality-reflection/latest"] });
    }, 2000);

    return () => clearInterval(interval);
  }, [reflection?.id, reflection?.status, queryClient]);

  // Existing derived values
  const blindSpots = insights.filter((i) => i.insightType === "blind_spot");
  const growthOpportunities = insights.filter((i) => i.insightType === "growth_opportunity");

  const selectedCategoriesData = userCategories.map((uc) => {
    const category = categories.find((c: any) => c.id === uc.categoryId);
    return {
      ...uc,
      categoryName: category?.name || "Unknown Category",
    };
  });

  const reflectionActive = reflection?.status === "pending" || reflection?.status === "processing";

  return (
    <div className="space-y-6">
      {/* Category Tracking Section */}
      {selectedCategoriesData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold" data-testid="text-category-tracking-header">
              Your Focus Areas
            </h2>
          </div>
          <div className="grid gap-6">
            {selectedCategoriesData.map((selectedCategory) => (
              <CategorySection
                key={selectedCategory.categoryId}
                categoryId={selectedCategory.categoryId}
                categoryName={selectedCategory.categoryName}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* ✅ InnerTruth Profile Card */}
        <Card data-testid="card-personality-overview">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">InnerTruth Profile</CardTitle>
              <CardDescription>Your current personality snapshot</CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => generateProfileMutation.mutate()}
              disabled={generateProfileMutation.isPending || reflectionActive}
              data-testid="button-update-profile"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {reflectionActive ? "Updating…" : "Update Profile"}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Loading */}
            {reflectionLoading && <p className="text-sm text-muted-foreground">Loading your profile…</p>}

            {/* Real error (not 404) */}
            {reflectionError && !reflectionNotFound && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Couldn’t load your profile</p>
                    <p className="text-sm text-muted-foreground">
                      Please refresh or try again later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No reflection yet */}
            {!reflectionLoading && (reflectionNotFound || !reflection) && !reflectionError && (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-muted-foreground">
                  You haven’t generated an InnerTruth profile yet.
                </p>
                <Button
                  onClick={() => generateProfileMutation.mutate()}
                  disabled={generateProfileMutation.isPending}
                  data-testid="button-generate-profile"
                >
                  Generate Profile
                </Button>
                <p className="text-xs text-muted-foreground">Takes about 1–2 minutes.</p>
              </div>
            )}

            {/* Failed state */}
            {reflection?.status === "failed" && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Profile generation failed</p>
                    <p className="text-sm text-muted-foreground">
                      {reflection.errorMessage || "Please try again."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => generateProfileMutation.mutate()}
                  disabled={generateProfileMutation.isPending}
                  data-testid="button-retry-profile"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Progress state */}
            {reflectionActive && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Updating profile…</p>
                  <p className="text-sm text-muted-foreground">{reflection?.progress ?? 0}%</p>
                </div>
                <Progress value={reflection?.progress ?? 0} />
                {reflection?.currentSection && (
                  <p className="text-xs text-muted-foreground">{reflection.currentSection}</p>
                )}
              </div>
            )}

            {/* Completed state */}
            {reflection?.status === "completed" && (
              <div className="space-y-4">
                {reflection.summary && (
                  <p className="text-sm text-muted-foreground">
                    {reflection.summary.length > 220
                      ? reflection.summary.slice(0, 220) + "…"
                      : reflection.summary}
                  </p>
                )}

                {/* Big Five Bars */}
                {reflection.coreTraits?.big5 ? (
                  <div className="space-y-3">
                    {(
                      [
                        ["Openness", reflection.coreTraits.big5.openness],
                        ["Conscientiousness", reflection.coreTraits.big5.conscientiousness],
                        ["Extraversion", reflection.coreTraits.big5.extraversion],
                        ["Agreeableness", reflection.coreTraits.big5.agreeableness],
                        ["Neuroticism", reflection.coreTraits.big5.neuroticism],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{label}</span>
                          <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>
                        </div>
                        <Progress value={value} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your profile is ready, but traits aren’t available yet.
                  </p>
                )}

                <div className="flex gap-2">
                  <Link href="/personality-reflection">
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-view-full-report"
                    >
                      View Full Report <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing cards (if you have them below, keep them) */}
        <Card data-testid="card-stats-overview">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Your Activity</CardTitle>
            <CardDescription>Overview of your recent usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" /> Conversations
              </span>
              <span className="font-medium">{stats?.conversationCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" /> Journal Entries
              </span>
              <span className="font-medium">{stats?.journalEntryCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ClipboardCheck className="h-4 w-4" /> Insights
              </span>
              <span className="font-medium">{stats?.insightCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4" /> Streak
              </span>
              <span className="font-medium">{stats?.streak ?? 0} days</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-insights-overview">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Insights</CardTitle>
            <CardDescription>Your latest blind spots and growth cues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Blind Spots</p>
              <p>{blindSpots.length}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Growth Opportunities</p>
              <p>{growthOpportunities.length}</p>
            </div>

            <Link href="/insights">
              <Button variant="outline" className="w-full">
                View Insights <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
