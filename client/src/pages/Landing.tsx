import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageCircle, BookOpen, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Mirror</h1>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Discover the truth about yourself
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              An AI-powered personality analyzer that gives you honest, deep insights about who you really are—not who you think you are.
            </p>
          </div>

          <Button size="lg" asChild className="text-lg px-8" data-testid="button-get-started">
            <a href="/api/login">Get Started</a>
          </Button>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card>
              <CardHeader>
                <MessageCircle className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Deep Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chat with an AI analyst that asks the hard questions you avoid
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Private Journal</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Reflect daily and uncover patterns in your thoughts and emotions
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Blind Spots</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Discover what you can't see about yourself—your hidden patterns
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Personality Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get comprehensive Big 5 traits analysis and growth opportunities
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 p-6 bg-muted rounded-lg text-left max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Privacy First:</strong> Your conversations, journals, and insights are completely private. Only you can access your data. We use AI to help you understand yourself better, not to judge or share your information.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Mirror • Your honest AI personality analyst</p>
        </div>
      </footer>
    </div>
  );
}
