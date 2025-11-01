import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import analysisImage from "@assets/generated_images/Analysis_process_illustration_571ba544.png";
import { AlertCircle, TrendingUp } from "lucide-react";

const personalityData = [
  { trait: "Openness", value: 85 },
  { trait: "Conscientiousness", value: 72 },
  { trait: "Extraversion", value: 45 },
  { trait: "Agreeableness", value: 68 },
  { trait: "Emotional Stability", value: 55 },
];

export function PersonalityPreviewSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-2xl md:text-3xl font-medium italic text-muted-foreground mb-4">
            "The truth will set you free"
          </p>
          <p className="text-lg text-muted-foreground">
            Experience honest, data-driven insights about your personality
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
          <Card data-testid="card-personality-chart">
            <CardHeader>
              <CardTitle>Your Personality Profile</CardTitle>
              <CardDescription>Multi-dimensional trait analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={personalityData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <Radar
                    name="Traits"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card className="border-l-4 border-l-destructive" data-testid="card-blind-spot">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">Blind Spot Detected</CardTitle>
                    <Badge variant="destructive" className="text-xs">High Priority</Badge>
                  </div>
                  <CardDescription className="text-base">
                    Your communication style shows a pattern of avoiding conflict, which may prevent genuine connection in relationships. Consider addressing disagreements directly.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
            
            <Card className="border-l-4 border-l-primary" data-testid="card-growth-opportunity">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">Growth Opportunity</CardTitle>
                    <Badge className="text-xs">Actionable</Badge>
                  </div>
                  <CardDescription className="text-base">
                    Your high openness score suggests untapped creative potential. Dedicate time to exploring new artistic or intellectual pursuits.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-center">
          <img 
            src={analysisImage} 
            alt="AI analysis process" 
            className="max-w-md w-full rounded-lg opacity-80"
          />
        </div>
      </div>
    </section>
  );
}
