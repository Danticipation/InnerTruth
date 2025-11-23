import { DashboardNav } from "@/components/DashboardNav";
import { MoodInterface } from "@/components/MoodInterface";

export default function Mood() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-1 sm:mb-2">Mood Tracker</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your moods and emotions to understand patterns over time
          </p>
        </div>
        <MoodInterface />
      </main>
    </div>
  );
}
