import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ClipboardList, BookOpen, Brain, TrendingUp, Eye } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Conversations",
    description: "Chat freely about your thoughts, feelings, and experiences. Our AI analyzes patterns in your communication style and emotional expression."
  },
  {
    icon: ClipboardList,
    title: "Personality Questionnaires",
    description: "Complete comprehensive assessments covering values, behaviors, relationships, and goals to build your personality foundation."
  },
  {
    icon: BookOpen,
    title: "Digital Journaling",
    description: "Write daily reflections and track your inner world. AI identifies recurring themes, emotions, and growth patterns over time."
  },
  {
    icon: Brain,
    title: "Deep Analysis",
    description: "Advanced AI creates a mirror image of your personality, revealing core traits, motivations, and behavioral patterns."
  },
  {
    icon: Eye,
    title: "Blind Spot Detection",
    description: "Discover aspects of yourself you weren't aware of. Uncover hidden biases, contradictions, and unconscious patterns."
  },
  {
    icon: TrendingUp,
    title: "Growth Roadmap",
    description: "Receive personalized insights and actionable recommendations to improve specific aspects of your life and personality."
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Complete Personality Analysis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Multiple data sources combine to create the most accurate reflection of who you truly are
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
