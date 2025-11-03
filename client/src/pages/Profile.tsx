import { DashboardNav } from "@/components/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, Mail } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" data-testid="text-profile-title">Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-profile-description">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-account-title">Account Information</CardTitle>
              <CardDescription>Your personal details and authentication info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16" data-testid="avatar-profile">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    {user?.lastName?.[0]?.toUpperCase() || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 rounded-md border">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-fullname">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-md border">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-email">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle data-testid="text-session-title">Session</CardTitle>
              <CardDescription>Manage your current session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="gap-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
