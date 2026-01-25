import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Heart,
  Brain,
  Sparkles,
  Briefcase,
  Scale,
  Clock,
  MessageSquare,
  User
} from "lucide-react";

// Icon mapping for categories
const categoryIcons: Record<string, typeof Heart> = {
  "relationships": Heart,
  "emotional-regulation": Brain,
  "confidence": Sparkles,
  "career": Briefcase,
  "decision-making": Scale,
  "work-life-balance": Clock,
  "conflict-resolution": MessageSquare,
  "authenticity": User
};

// Tier badge colors
const tierColors: Record<string, string> = {
  "free": "bg-green-500/10 text-green-600 dark:text-green-400",
  "standard": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "premium": "bg-purple-500/10 text-purple-600 dark:text-purple-400"
};

export default function CategoryOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // For MVP, use free tier (1 category limit)
  const currentTier = "free";
  const tierLimits = {
    free: 1,
    standard: 3,
    premium: Infinity
  };
  
  const maxCategories = tierLimits[currentTier as keyof typeof tierLimits];

  // Fetch available categories
  const { data: categories, isLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Select category mutation
  const selectCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest("POST", "/api/user-categories", {
        categoryId
      });
      return response;
    },
    onSuccess: (data) => {
      // Update cache immediately to prevent OnboardingGuard race condition
      queryClient.setQueryData(["/api/user-categories"], (old: any) => {
        const existing = old || [];
        if (existing.some((c: any) => c.categoryId === data.categoryId)) {
          return existing;
        }
        return [...existing, data];
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/user-categories"] });
      
      toast({
        title: "Success!",
        description: "Your improvement journey begins now.",
      });
      
      // Small delay to ensure state propagates before redirect
      setTimeout(() => setLocation("/dashboard"), 100);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save category selection.",
      });
    }
  });

  const handleCategoryToggle = (categoryId: string) => {
    const category = categories?.find((c: any) => c.id === categoryId);
    
    // Track click on premium category
    if (category?.isPremium) {
      apiRequest("POST", "/api/analytics/events", {
        eventType: 'premium_feature_click',
        eventData: { feature: 'premium_category', categoryId }
      }).catch(console.error);
    }

    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        if (prev.length >= maxCategories) {
          // Track limit reached
          apiRequest("POST", "/api/analytics/events", {
            eventType: 'tier_limit_reached',
            eventData: { limit: 'category_selection', currentTier }
          }).catch(console.error);

          toast({
            variant: "destructive",
            title: "Category limit reached",
            description: `Your ${currentTier} plan allows ${maxCategories} ${maxCategories === 1 ? 'category' : 'categories'}. Upgrade for more.`,
          });
          return prev;
        }
        return [...prev, categoryId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      toast({
        variant: "destructive",
        title: "Select a category",
        description: "Please choose at least one area to improve.",
      });
      return;
    }
    
    // For MVP, only support single category selection
    selectCategoryMutation.mutate(selectedCategories[0]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
        <div className="text-center space-y-4">
          <Logo size="lg" />
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <Logo size="md" showText={false} />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold">
            What do you want to improve?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose an area of your life to track and improve. Mirror will analyze your journal entries 
            and conversations to provide personalized insights and scores.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" data-testid="badge-tier">
              {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
            </Badge>
            <span>•</span>
            <span>
              {selectedCategories.length} of {maxCategories === Infinity ? '∞' : maxCategories} selected
            </span>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {(categories as any[] || []).map((category: any) => {
            const Icon = categoryIcons[category.id] || Sparkles;
            const isSelected = selectedCategories.includes(category.id);
            
            return (
              <Card
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`
                  cursor-pointer p-6 hover-elevate active-elevate-2 transition-all
                  ${isSelected ? 'ring-2 ring-primary bg-accent/20' : ''}
                `}
                data-testid={`card-category-${category.id}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`
                    p-2 rounded-lg 
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-accent'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={tierColors[category.tier]}
                    data-testid={`badge-tier-${category.id}`}
                  >
                    {category.tier}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-medium mb-2" data-testid={`text-name-${category.id}`}>
                  {category.name}
                </h3>
                
                <p className="text-sm text-muted-foreground" data-testid={`text-description-${category.id}`}>
                  {category.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={selectCategoryMutation.isPending}
            className="w-full sm:w-auto px-8"
            data-testid="button-continue"
          >
            {selectCategoryMutation.isPending ? "Saving..." : "Continue"}
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLocation("/dashboard")}
            className="w-full sm:w-auto"
            data-testid="button-skip"
          >
            Skip for now
          </Button>
        </div>

        {/* Upgrade prompt for free users */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Want to track more areas?{" "}
            <button className="text-primary hover:underline font-medium">
              Upgrade to Standard (3 categories) or Premium (unlimited)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
