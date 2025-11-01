import { DashboardNav } from "@/components/DashboardNav";
import { JournalInterface } from "@/components/JournalInterface";

export default function Journal() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Journal</h1>
          <p className="text-muted-foreground">
            Reflect on your thoughts and track your personal growth
          </p>
        </div>
        <JournalInterface />
      </main>
    </div>
  );
}
