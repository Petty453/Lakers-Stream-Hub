import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Calendar, Users, Newspaper, Activity, Trophy, Home } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Live Game", icon: Home },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/roster", label: "Roster", icon: Users },
    { href: "/news", label: "News", icon: Newspaper },
    { href: "/injuries", label: "Injuries", icon: Activity },
    { href: "/standings", label: "Standings", icon: Trophy },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground dark">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center px-4">
          <Link href="/" className="mr-8 flex items-center space-x-3">
            <img 
              src="https://a.espncdn.com/i/teamlogos/nba/500/lal.png" 
              alt="Lakers Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className="hidden font-bold tracking-wider text-primary sm:inline-block uppercase">
              Lakers Hub
            </span>
          </Link>
          <nav className="flex items-center space-x-1 md:space-x-4 flex-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline-block">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8 px-4 relative">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-center z-[-1]">
          <div className="w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full absolute -top-40 opacity-50 mix-blend-screen" />
          <div className="w-[600px] h-[400px] bg-secondary/10 blur-[100px] rounded-full absolute top-20 opacity-30 mix-blend-screen" />
        </div>
        {children}
      </main>
    </div>
  );
}
