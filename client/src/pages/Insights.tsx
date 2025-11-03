import { DashboardNav } from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Eye, TrendingUp, Loader2 } from "lucide-react";

type PersonalityInsight = {
  id: string;
  userId: string;
  insightType: string;
  title: string;
  description: string;
  priority: string;
  createdAt: Date;
};

export default function Insights() {
  const { data: insights = [], isLoading } = useQuery<PersonalityInsight[]>({
    queryKey: ["/api/insights"],
  });

  const blindSpots = insights.filter(i => i.insightType === "blind_spot");
  const growthOpportunities = insights.filter(i => i.insightType === "growth_opportunity");

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-insights-title">Your Insights</h1>
          <p className="text-muted-foreground" data-testid="text-insights-description">
            AI-generated observations about your personality patterns, blind spots, and growth opportunities
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : insights.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-insights">
                  No insights yet. Keep journaling and chatting with the AI to generate insights!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {blindSpots.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold" data-testid="text-blindspots-title">Blind Spots</h2>
                  <Badge variant="secondary" data-testid="badge-blindspots-count">{blindSpots.length}</Badge>
                </div>
                <div className="space-y-4">
                  {blindSpots.map((insight) => (
                    <Card key={insight.id} data-testid={`card-insight-${insight.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-lg" data-testid={`text-insight-title-${insight.id}`}>
                            {insight.title}
                          </CardTitle>
                          <Badge variant={getPriorityVariant(insight.priority)} data-testid={`badge-priority-${insight.id}`}>
                            {insight.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground" data-testid={`text-insight-description-${insight.id}`}>
                          {insight.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {growthOpportunities.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold" data-testid="text-growth-title">Growth Opportunities</h2>
                  <Badge variant="secondary" data-testid="badge-growth-count">{growthOpportunities.length}</Badge>
                </div>
                <div className="space-y-4">
                  {growthOpportunities.map((insight) => (
                    <Card key={insight.id} data-testid={`card-insight-${insight.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-lg" data-testid={`text-insight-title-${insight.id}`}>
                            {insight.title}
                          </CardTitle>
                          <Badge variant={getPriorityVariant(insight.priority)} data-testid={`badge-priority-${insight.id}`}>
                            {insight.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground" data-testid={`text-insight-description-${insight.id}`}>
                          {insight.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
