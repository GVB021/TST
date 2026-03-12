import { useAuth } from "@/hooks/use-auth";
import { useStudios } from "@/hooks/use-studios";
import { Link, useLocation } from "wouter";
import { Building2, Loader2, ArrowRight, LogOut, Mic2 } from "lucide-react";
import { pt } from "@/lib/i18n";
import { RoleBadge } from "@/components/ui/design-system";

export default function StudioSelect() {
  const { user, isLoading: userLoading, logout } = useAuth();
  const { data: studios, isLoading: studiosLoading } = useStudios();
  const [, setLocation] = useLocation();

  if (userLoading || studiosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/4 blur-[140px] rounded-full" />
      </div>

      <header className="relative z-10 vhub-topnav px-8 h-14">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-7 h-7 rounded-lg bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
            <Mic2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight">V.HUB</span>
        </div>
        <button
          onClick={logout}
          className="vhub-btn-ghost vhub-btn-xs gap-1.5"
          data-testid="button-logout"
        >
          <LogOut className="h-3.5 w-3.5" />
          {pt.auth.signOut}
        </button>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-8 pt-16 pb-12 page-enter">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="vhub-label-accent mb-3">
              {pt.common.welcomeBack}, {(user?.email ?? user?.displayName ?? user?.firstName ?? "Usuario").split("@")[0]}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-studios-title">{pt.studio.yourStudios}</h1>
          </div>

        </div>

        {!studios?.length ? (
          <div className="vhub-card-glass rounded-2xl p-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-1" data-testid="text-no-studios">
              {user.role === "platform_owner" ? pt.studio.noStudios : pt.studio.noStudiosUser}
            </h3>
            <p className="vhub-body text-muted-foreground">
              {user.role === "platform_owner"
                ? "Crie estudios pelo painel administrativo."
                : pt.studio.noStudiosUserDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studios.map((studio) => (
              <Link
                key={studio.id}
                href={`/studio/${studio.id}/dashboard`}
                className="block group"
                data-testid={`card-studio-${studio.id}`}
              >
                <div className="vhub-card-glass rounded-2xl p-6 h-full cursor-pointer transition-all duration-150 ease-out hover:border-primary/20 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)] hover:scale-[1.008] active:scale-[0.997] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-105">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-lg">{studio.name}</h3>
                  {(studio as any).userRoles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(studio as any).userRoles.map((r: string) => (
                        <RoleBadge key={r} role={r} />
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors duration-200">
                    {pt.studio.openWorkspace}
                    <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
