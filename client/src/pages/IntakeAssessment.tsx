import { useState } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Brain, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

const TOTAL_STEPS = 5;

interface AssessmentData {
  // Step 1: Basic Information
  age?: string;
  occupation?: string;
  relationshipStatus?: string;
  
  // Step 2: Life Satisfaction
  lifeOverallSatisfaction?: string;
  workSatisfaction?: string;
  relationshipsSatisfaction?: string;
  healthSatisfaction?: string;
  
  // Step 3: Personality Traits (Big 5)
  opennessScore?: string;
  conscientiousnessScore?: string;
  extraversionScore?: string;
  agreeablenessScore?: string;
  emotionalStabilityScore?: string;
  
  // Step 4: Current Challenges
  primaryChallenge?: string;
  challengeDescription?: string;
  
  // Step 5: Goals & Motivations
  mainGoal?: string;
  motivationLevel?: string;
  supportNeeded?: string;
}

export default function IntakeAssessment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<AssessmentData>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const updateData = (field: keyof AssessmentData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const saveAssessmentMutation = useMutation({
    mutationFn: async () => {
      // For now, we'll save this as a special journal entry
      const assessmentText = `
INTAKE ASSESSMENT RESULTS

Basic Information:
- Age Range: ${data.age || 'Not provided'}
- Occupation: ${data.occupation || 'Not provided'}
- Relationship Status: ${data.relationshipStatus || 'Not provided'}

Life Satisfaction (1-10):
- Overall: ${data.lifeOverallSatisfaction || 'Not rated'}/10
- Work: ${data.workSatisfaction || 'Not rated'}/10
- Relationships: ${data.relationshipsSatisfaction || 'Not rated'}/10
- Health: ${data.healthSatisfaction || 'Not rated'}/10

Personality Self-Assessment (1-10):
- Openness to Experience: ${data.opennessScore || 'Not rated'}/10
- Conscientiousness: ${data.conscientiousnessScore || 'Not rated'}/10
- Extraversion: ${data.extraversionScore || 'Not rated'}/10
- Agreeableness: ${data.agreeablenessScore || 'Not rated'}/10
- Emotional Stability: ${data.emotionalStabilityScore || 'Not rated'}/10

Current Challenges:
- Primary Challenge: ${data.primaryChallenge || 'Not provided'}
- Details: ${data.challengeDescription || 'Not provided'}

Goals & Motivations:
- Main Goal: ${data.mainGoal || 'Not provided'}
- Motivation Level: ${data.motivationLevel || 'Not rated'}/10
- Support Needed: ${data.supportNeeded || 'Not provided'}
      `.trim();

      const wordCount = assessmentText.split(/\s+/).filter(w => w).length;
      
      return await apiRequest("POST", "/api/journal-entries", {
        content: assessmentText,
        prompt: "Initial Intake Assessment",
        wordCount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Assessment Complete!",
        description: "Your responses have been saved and will help personalize your experience.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save assessment. Please try again.",
      });
    },
  });

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      saveAssessmentMutation.mutate();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.age && data.occupation && data.relationshipStatus;
      case 2:
        return data.lifeOverallSatisfaction && data.workSatisfaction && 
               data.relationshipsSatisfaction && data.healthSatisfaction;
      case 3:
        return data.opennessScore && data.conscientiousnessScore && 
               data.extraversionScore && data.agreeablenessScore && 
               data.emotionalStabilityScore;
      case 4:
        return data.primaryChallenge && data.challengeDescription;
      case 5:
        return data.mainGoal && data.motivationLevel && data.supportNeeded;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="age">Age Range</Label>
              <RadioGroup value={data.age} onValueChange={(val) => updateData('age', val)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="18-24" id="age-18-24" />
                  <Label htmlFor="age-18-24" className="font-normal cursor-pointer">18-24</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="25-34" id="age-25-34" />
                  <Label htmlFor="age-25-34" className="font-normal cursor-pointer">25-34</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="35-44" id="age-35-44" />
                  <Label htmlFor="age-35-44" className="font-normal cursor-pointer">35-44</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="45-54" id="age-45-54" />
                  <Label htmlFor="age-45-54" className="font-normal cursor-pointer">45-54</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="55+" id="age-55+" />
                  <Label htmlFor="age-55+" className="font-normal cursor-pointer">55+</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="occupation">Occupation / Field</Label>
              <Input
                id="occupation"
                placeholder="e.g., Software Engineer, Teacher, Student"
                value={data.occupation || ''}
                onChange={(e) => updateData('occupation', e.target.value)}
                data-testid="input-occupation"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="relationship">Relationship Status</Label>
              <RadioGroup value={data.relationshipStatus} onValueChange={(val) => updateData('relationshipStatus', val)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="rel-single" />
                  <Label htmlFor="rel-single" className="font-normal cursor-pointer">Single</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dating" id="rel-dating" />
                  <Label htmlFor="rel-dating" className="font-normal cursor-pointer">Dating</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="committed" id="rel-committed" />
                  <Label htmlFor="rel-committed" className="font-normal cursor-pointer">In a Committed Relationship</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="married" id="rel-married" />
                  <Label htmlFor="rel-married" className="font-normal cursor-pointer">Married/Partnered</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complicated" id="rel-complicated" />
                  <Label htmlFor="rel-complicated" className="font-normal cursor-pointer">It's Complicated</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
              Rate your satisfaction in each area from 1 (very dissatisfied) to 10 (very satisfied)
            </p>

            <div className="space-y-3">
              <Label>Overall Life Satisfaction</Label>
              <RadioGroup value={data.lifeOverallSatisfaction} onValueChange={(val) => updateData('lifeOverallSatisfaction', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`life-${num}`} />
                    <Label htmlFor={`life-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Work/Career Satisfaction</Label>
              <RadioGroup value={data.workSatisfaction} onValueChange={(val) => updateData('workSatisfaction', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`work-${num}`} />
                    <Label htmlFor={`work-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Relationships Satisfaction</Label>
              <RadioGroup value={data.relationshipsSatisfaction} onValueChange={(val) => updateData('relationshipsSatisfaction', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`rel-sat-${num}`} />
                    <Label htmlFor={`rel-sat-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Physical/Mental Health Satisfaction</Label>
              <RadioGroup value={data.healthSatisfaction} onValueChange={(val) => updateData('healthSatisfaction', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`health-${num}`} />
                    <Label htmlFor={`health-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
              Rate yourself on these personality dimensions from 1 (strongly disagree) to 10 (strongly agree)
            </p>

            <div className="space-y-3">
              <div>
                <Label>Openness to Experience</Label>
                <p className="text-xs text-muted-foreground mb-2">I enjoy trying new things and exploring new ideas</p>
              </div>
              <RadioGroup value={data.opennessScore} onValueChange={(val) => updateData('opennessScore', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`open-${num}`} />
                    <Label htmlFor={`open-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Conscientiousness</Label>
                <p className="text-xs text-muted-foreground mb-2">I am organized, responsible, and detail-oriented</p>
              </div>
              <RadioGroup value={data.conscientiousnessScore} onValueChange={(val) => updateData('conscientiousnessScore', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`consc-${num}`} />
                    <Label htmlFor={`consc-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Extraversion</Label>
                <p className="text-xs text-muted-foreground mb-2">I am outgoing and energized by social interactions</p>
              </div>
              <RadioGroup value={data.extraversionScore} onValueChange={(val) => updateData('extraversionScore', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`extra-${num}`} />
                    <Label htmlFor={`extra-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Agreeableness</Label>
                <p className="text-xs text-muted-foreground mb-2">I am cooperative, compassionate, and value harmony</p>
              </div>
              <RadioGroup value={data.agreeablenessScore} onValueChange={(val) => updateData('agreeablenessScore', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`agree-${num}`} />
                    <Label htmlFor={`agree-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Emotional Stability</Label>
                <p className="text-xs text-muted-foreground mb-2">I handle stress well and remain emotionally balanced</p>
              </div>
              <RadioGroup value={data.emotionalStabilityScore} onValueChange={(val) => updateData('emotionalStabilityScore', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`emot-${num}`} />
                    <Label htmlFor={`emot-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="challenge">What is your primary challenge or concern right now?</Label>
              <RadioGroup value={data.primaryChallenge} onValueChange={(val) => updateData('primaryChallenge', val)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="relationships" id="chal-rel" />
                  <Label htmlFor="chal-rel" className="font-normal cursor-pointer">Relationship Issues</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="career" id="chal-career" />
                  <Label htmlFor="chal-career" className="font-normal cursor-pointer">Career/Work Challenges</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anxiety" id="chal-anxiety" />
                  <Label htmlFor="chal-anxiety" className="font-normal cursor-pointer">Anxiety/Stress</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selfesteem" id="chal-esteem" />
                  <Label htmlFor="chal-esteem" className="font-normal cursor-pointer">Self-Esteem/Confidence</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="purpose" id="chal-purpose" />
                  <Label htmlFor="chal-purpose" className="font-normal cursor-pointer">Finding Purpose/Direction</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="habits" id="chal-habits" />
                  <Label htmlFor="chal-habits" className="font-normal cursor-pointer">Breaking Bad Habits</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="chal-other" />
                  <Label htmlFor="chal-other" className="font-normal cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="challenge-desc">Tell us more about this challenge (optional)</Label>
              <Textarea
                id="challenge-desc"
                placeholder="Describe what you're going through and how it's affecting you..."
                className="min-h-[120px]"
                value={data.challengeDescription || ''}
                onChange={(e) => updateData('challengeDescription', e.target.value)}
                data-testid="textarea-challenge"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="goal">What is your main goal with using Mirror?</Label>
              <Textarea
                id="goal"
                placeholder="e.g., Improve my relationships, build confidence, understand myself better..."
                className="min-h-[100px]"
                value={data.mainGoal || ''}
                onChange={(e) => updateData('mainGoal', e.target.value)}
                data-testid="textarea-goal"
              />
            </div>

            <div className="space-y-3">
              <Label>How motivated are you to make changes? (1 = not motivated, 10 = extremely motivated)</Label>
              <RadioGroup value={data.motivationLevel} onValueChange={(val) => updateData('motivationLevel', val)} className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <div key={num} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(num)} id={`motiv-${num}`} />
                    <Label htmlFor={`motiv-${num}`} className="font-normal cursor-pointer">{num}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="support">What kind of support or guidance are you looking for?</Label>
              <Textarea
                id="support"
                placeholder="e.g., Honest feedback, actionable advice, someone to listen..."
                className="min-h-[100px]"
                value={data.supportNeeded || ''}
                onChange={(e) => updateData('supportNeeded', e.target.value)}
                data-testid="textarea-support"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Information";
      case 2: return "Life Satisfaction";
      case 3: return "Personality Self-Assessment";
      case 4: return "Current Challenges";
      case 5: return "Goals & Motivations";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Comprehensive Intake Assessment</h1>
          </div>
          <p className="text-muted-foreground">
            Help us understand you better to provide personalized insights and guidance
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {TOTAL_STEPS}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Let's start with some basic information about you"}
              {currentStep === 2 && "How satisfied are you with different areas of your life?"}
              {currentStep === 3 && "Help us understand your personality traits"}
              {currentStep === 4 && "What brings you here today?"}
              {currentStep === 5 && "What are you hoping to achieve?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
            
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  data-testid="button-prev-step"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              <Button
                onClick={nextStep}
                disabled={!canProceed() || saveAssessmentMutation.isPending}
                className="ml-auto"
                data-testid="button-next-step"
              >
                {currentStep === TOTAL_STEPS ? (
                  saveAssessmentMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      Complete Assessment
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
