import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CategoryTrendChartProps {
  categoryId: string;
  categoryName: string;
}

export function CategoryTrendChart({ categoryId, categoryName }: CategoryTrendChartProps) {
  const [periodType, setPeriodType] = useState<"daily" | "weekly">("daily");

  // Fetch score history
  const { data: scores, isLoading, isError } = useQuery({
    queryKey: [`/api/category-scores/${categoryId}?period=${periodType}&limit=30`],
  });

  if (isLoading) {
    return (
      <Card className="p-6" data-testid="card-trend-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-accent rounded w-1/3"></div>
          <div className="h-64 bg-accent rounded"></div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6" data-testid="card-trend-error">
        <p className="text-sm text-destructive">Failed to load trend data</p>
      </Card>
    );
  }

  const scoreData = (scores as any[] || []);
  
  // Calculate latest score and delta
  const latestScore = scoreData[scoreData.length - 1];
  const previousScore = scoreData[scoreData.length - 2];
  const scoreDelta = latestScore && previousScore 
    ? latestScore.score - previousScore.score 
    : null;

  // Format data for Recharts
  const chartData = scoreData.map((score: any) => ({
    date: format(new Date(score.periodStart), periodType === "daily" ? "MMM d" : "MMM d"),
    score: score.score,
    fullDate: new Date(score.periodStart).toLocaleDateString(),
    reasoning: score.reasoning,
  }));

  // Calculate average score
  const averageScore = scoreData.length > 0
    ? Math.round(scoreData.reduce((sum: number, s: any) => sum + s.score, 0) / scoreData.length)
    : undefined;

  return (
    <Card className="p-6" data-testid="card-trend-chart">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-medium mb-1" data-testid="text-category-name">
            {categoryName} Progress
          </h3>
          {scoreData.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Tracking since {format(new Date(scoreData[0].periodStart), "MMM d, yyyy")}
            </p>
          )}
        </div>

        {/* Period Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={periodType === "daily" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType("daily")}
            data-testid="button-period-daily"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Daily
          </Button>
          <Button
            variant={periodType === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType("weekly")}
            data-testid="button-period-weekly"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Weekly
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {scoreData.length === 0 && (
        <div className="text-center py-12" data-testid="div-empty-state">
          <p className="text-muted-foreground mb-2">No scores yet</p>
          <p className="text-sm text-muted-foreground">
            Keep journaling and chatting. Scores will appear here as you build up data.
          </p>
        </div>
      )}

      {/* Stats Row */}
      {scoreData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {/* Latest Score */}
          <div className="space-y-1" data-testid="div-latest-score">
            <p className="text-sm text-muted-foreground">Current Score</p>
            <p className="text-3xl font-bold text-primary">
              {latestScore?.score || 0}
            </p>
          </div>

          {/* Score Delta */}
          {scoreDelta !== null && (
            <div className="space-y-1" data-testid="div-score-delta">
              <p className="text-sm text-muted-foreground">Change</p>
              <div className="flex items-center gap-1">
                {scoreDelta > 0 && (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      +{scoreDelta}
                    </span>
                  </>
                )}
                {scoreDelta < 0 && (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {scoreDelta}
                    </span>
                  </>
                )}
                {scoreDelta === 0 && (
                  <>
                    <Minus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-2xl font-bold text-muted-foreground">0</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Average Score */}
          {averageScore !== undefined && (
            <div className="space-y-1" data-testid="div-average-score">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-2xl font-bold">{averageScore}</p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {scoreData.length > 0 && (
        <div className="h-64 sm:h-80" data-testid="div-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: "currentColor", className: "fill-muted-foreground" }}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: "currentColor", className: "fill-muted-foreground" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <Card className="p-3 shadow-lg">
                        <p className="text-sm font-medium mb-1">{data.fullDate}</p>
                        <p className="text-2xl font-bold text-primary mb-2">
                          Score: {data.score}
                        </p>
                        {data.reasoning && (
                          <p className="text-xs text-muted-foreground max-w-xs">
                            {data.reasoning.substring(0, 100)}...
                          </p>
                        )}
                      </Card>
                    );
                  }
                  return null;
                }}
              />
              {averageScore !== undefined && (
                <ReferenceLine
                  y={averageScore}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg: ${averageScore}`,
                    position: "right",
                    className: "text-xs fill-muted-foreground"
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Contributors */}
      {latestScore && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Latest analysis based on {latestScore.contributorsJournals || 0} journal {latestScore.contributorsJournals === 1 ? 'entry' : 'entries'} 
            {' '}and {latestScore.contributorsMessages || 0} chat {latestScore.contributorsMessages === 1 ? 'message' : 'messages'}
            {' '}• {latestScore.confidenceLevel} confidence
          </p>
        </div>
      )}
    </Card>
  );
}
