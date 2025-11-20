import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import heroImage from "@assets/generated_images/Hero-Background-image.png";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 sm:mb-6 leading-tight">
          Discover the{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Hard Truth
          </span>
          {" "}About Yourself
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          The most in-depth AI personality analyzer. Uncover blind spots, understand patterns, and transform who you are through honest self-reflection.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
            data-testid="button-start-journey"
          >
            Start Your Journey <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg backdrop-blur-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
            data-testid="button-how-it-works"
          >
            See How It Works
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-white/80 px-4">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm">Join 50,000+ people discovering themselves</span>
        </div>
      </div>
    </section>
  );
}
