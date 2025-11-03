import { DashboardNav } from "@/components/DashboardNav";
import { DashboardOverview } from "@/components/DashboardOverview";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-1 sm:mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Continue your journey of self-discovery</p>
        </div>
        <DashboardOverview />
      </main>
    </div>
  );
}
