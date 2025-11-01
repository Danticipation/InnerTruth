import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, MessageCircle, BarChart3, Lightbulb } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: CheckCircle2,
    title: "Share Your Story",
    description: "Complete questionnaires, chat with AI, and write journal entries at your own pace."
  },
  {
    number: 2,
    icon: MessageCircle,
    title: "Ongoing Analysis",
    description: "AI continuously analyzes your inputs, identifying patterns and building your personality profile."
  },
  {
    number: 3,
    icon: BarChart3,
    title: "Receive Insights",
    description: "Get comprehensive analysis of your traits, behaviors, and emotional patterns."
  },
  {
    number: 4,
    icon: Lightbulb,
    title: "Grow & Transform",
    description: "Use personalized recommendations to address blind spots and achieve meaningful growth."
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Your journey to self-discovery in four simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative" data-testid={`card-step-${index}`}>
                <CardContent className="pt-12 pb-6">
                  <div className="absolute -top-6 left-6 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <div className="mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
