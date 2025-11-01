import { DashboardNav } from "@/components/DashboardNav";
import { ChatInterface } from "@/components/ChatInterface";

export default function Chat() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">AI Chat</h1>
          <p className="text-muted-foreground">
            Have an open conversation about anything on your mind
          </p>
        </div>
        <ChatInterface />
      </main>
    </div>
  );
}
