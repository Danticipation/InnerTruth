import { DashboardNav } from "@/components/DashboardNav";
import { ChatInterface } from "@/components/ChatInterface";

export default function Chat() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-1 sm:mb-2">AI Chat</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Have an open conversation about anything on your mind
          </p>
        </div>
        <ChatInterface />
      </main>
    </div>
  );
}
