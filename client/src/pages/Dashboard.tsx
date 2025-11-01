import { DashboardNav } from "@/components/DashboardNav";
import { DashboardOverview } from "@/components/DashboardOverview";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Continue your journey of self-discovery</p>
        </div>
        <DashboardOverview />
      </main>
    </div>
  );
}
