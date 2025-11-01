import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    initials: "SC",
    role: "Product Designer",
    text: "Mirror showed me patterns I'd been blind to for years. The AI insights about my conflict avoidance were uncomfortable but transformative. I'm now having more honest conversations.",
    rating: 5
  },
  {
    name: "Marcus Johnson",
    initials: "MJ",
    role: "Entrepreneur",
    text: "I thought I knew myself well. This app proved me wrong in the best way. The personality analysis revealed blind spots affecting my leadership. Game-changing.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    initials: "ER",
    role: "Therapist",
    text: "As a professional, I'm impressed by the depth of analysis. The combination of journaling, conversations, and assessments creates remarkably accurate insights.",
    rating: 5
  },
  {
    name: "David Kim",
    initials: "DK",
    role: "Software Engineer",
    text: "The data-driven approach appealed to me. Seeing my personality traits visualized and tracked over time helped me understand my growth objectively.",
    rating: 5
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Transformation Stories
          </h2>
          <p className="text-lg text-muted-foreground">
            Real people, real insights, real growth
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} data-testid={`card-testimonial-${index}`}>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-base mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <Avatar data-testid={`avatar-${index}`}>
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold" data-testid={`text-name-${index}`}>{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
