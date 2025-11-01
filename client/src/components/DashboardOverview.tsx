import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, BookOpen, ClipboardCheck, Flame, ArrowRight, AlertCircle, Lightbulb } from "lucide-react";

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card data-testid="card-profile-completion">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">68%</div>
            <Progress value={68} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Complete 3 more assessments for deeper insights
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-current-streak">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">12 Days</div>
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
            <div className="text-2xl font-bold mb-2">23</div>
            <p className="text-xs text-muted-foreground">
              8 new insights this week
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card data-testid="card-personality-score">
        <CardHeader>
          <CardTitle>Your Personality Overview</CardTitle>
          <CardDescription>Based on 45 conversations, 18 journal entries, and 3 assessments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Openness to Experience</span>
              <span className="font-semibold">85%</span>
            </div>
            <Progress value={85} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Conscientiousness</span>
              <span className="font-semibold">72%</span>
            </div>
            <Progress value={72} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Extraversion</span>
              <span className="font-semibold">45%</span>
            </div>
            <Progress value={45} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Agreeableness</span>
              <span className="font-semibold">68%</span>
            </div>
            <Progress value={68} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Emotional Stability</span>
              <span className="font-semibold">55%</span>
            </div>
            <Progress value={55} />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-destructive" data-testid="card-recent-insight-blind-spot">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">Recent Blind Spot</CardTitle>
                  <Badge variant="destructive" className="text-xs">New</Badge>
                </div>
                <CardDescription className="text-base">
                  Pattern detected: You tend to prioritize others' needs at the expense of your own boundaries, leading to burnout.
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
        
        <Card className="border-l-4 border-l-primary" data-testid="card-recent-insight-growth">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">Growth Recommendation</CardTitle>
                  <Badge className="text-xs">Actionable</Badge>
                </div>
                <CardDescription className="text-base">
                  Your journal entries show strong analytical thinking. Consider mentoring others to develop leadership skills.
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
      </div>
      
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Continue building your personality profile</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <Button className="h-auto py-6 flex-col gap-2" data-testid="button-start-chat">
            <MessageSquare className="h-6 w-6" />
            <span>Start a Chat</span>
          </Button>
          <Button className="h-auto py-6 flex-col gap-2" data-testid="button-write-journal">
            <BookOpen className="h-6 w-6" />
            <span>Write Journal Entry</span>
          </Button>
          <Button className="h-auto py-6 flex-col gap-2" data-testid="button-take-assessment">
            <ClipboardCheck className="h-6 w-6" />
            <span>Take Assessment</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
