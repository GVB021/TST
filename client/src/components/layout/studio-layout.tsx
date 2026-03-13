import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { ModeToggle } from "@/components/mode-toggle";

interface StudioLayoutProps {
  studioId: string;
  children: React.ReactNode;
}

export function StudioLayout({ studioId, children }: StudioLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground relative overflow-hidden">
        {/* Cinematic Background Gradient */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-40"></div>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-[0.03]"></div>
        </div>

        <AppSidebar studioId={studioId} />
        <div className="flex flex-col flex-1 w-full overflow-hidden min-w-0 relative z-10">
          <header className="flex h-16 shrink-0 items-center gap-4 px-6 sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 shadow-sm transition-all duration-300">
            <SidebarTrigger className="-ml-2 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all rounded-full" data-testid="button-sidebar-trigger" />
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <ModeToggle />
              
              {user?.role === "platform_owner" && (
                <Link href="/admin">
                  <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-muted" data-testid="button-header-admin">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Admin
                  </button>
                </Link>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
