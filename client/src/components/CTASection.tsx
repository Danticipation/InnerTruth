import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 px-6 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-6">
          Ready to See Your True Self?
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Start your journey to self-discovery today. No commitments, just honest insights.
        </p>
        
        <Button 
          size="lg" 
          variant="secondary"
          className="px-8 py-6 text-lg mb-8"
          data-testid="button-get-started"
        >
          Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        <div className="flex items-center justify-center gap-2 text-sm opacity-80">
          <Shield className="h-4 w-4" />
          <span>Your data is private and encrypted. Cancel anytime.</span>
        </div>
      </div>
    </section>
  );
}
