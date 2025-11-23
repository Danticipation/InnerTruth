import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { Home, MessageSquare, BookOpen, BarChart3, Brain, User, Menu, X, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/mood", label: "Mood", icon: Heart },
  { path: "/insights", label: "Insights", icon: BarChart3 },
  { path: "/reflection", label: "Reflection", icon: Brain },
  { path: "/profile", label: "Profile", icon: User },
];

export function DashboardNav() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="border-b sticky top-0 z-50 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader className="mb-6">
                  <SheetTitle>
                    <Logo size="sm" showText />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`button-mobile-nav-${item.label.toLowerCase()}`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
            
            <Link href="/dashboard" data-testid="link-logo">
              <Logo size="sm" />
            </Link>
          </div>
          
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
          
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Avatar data-testid="avatar-user" className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                JD
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}
