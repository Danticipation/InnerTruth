import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { Home, MessageSquare, BookOpen, BarChart3, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/insights", label: "Insights", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: User },
];

export function DashboardNav() {
  const [location] = useLocation();
  
  return (
    <nav className="border-b sticky top-0 z-50 bg-background">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" data-testid="link-logo">
            <Logo size="sm" />
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="gap-2"
                    data-testid={`button-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Avatar data-testid="avatar-user">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                JD
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}
