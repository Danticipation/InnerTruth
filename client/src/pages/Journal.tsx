import { DashboardNav } from "@/components/DashboardNav";
import { JournalInterface } from "@/components/JournalInterface";

export default function Journal() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-1 sm:mb-2">Journal</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Reflect on your thoughts and track your personal growth
          </p>
        </div>
        <JournalInterface />
      </main>
    </div>
  );
}
