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
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar studioId={studioId} />
        <div className="flex flex-col flex-1 w-full overflow-hidden min-w-0">
          <header className="flex h-14 shrink-0 items-center gap-3 px-6 sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1 h-8 w-8 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-sidebar-trigger" />
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
