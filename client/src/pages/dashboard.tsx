import { memo, useState } from "react";
import { useProductions } from "@/hooks/use-productions";
import { useSessions } from "@/hooks/use-sessions";
import { useStudio } from "@/hooks/use-studios";
import { useStaff } from "@/hooks/use-staff";
import { useStudioRole } from "@/hooks/use-studio-role";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ProductionCard } from "@/components/dashboard/production-card";
import { SessionCard } from "@/components/dashboard/session-card";
import {
  PageSection, PageHeader, StatCard
} from "@/components/ui/design-system";
import { Button } from "@/components/ui/button";
import { Film, Calendar, Users, Activity, Plus, Clock, UserPlus, ArrowRight, History, PlayCircle, ToggleRight, ToggleLeft } from "lucide-react";
import { Link } from "wouter";
import { pt } from "@/lib/i18n";
import { isSessionVisibleOnDashboard } from "@/lib/session-status";
import { cn } from "@/lib/utils";

const Dashboard = memo(function Dashboard({ studioId }: { studioId: string }) {
  const studio = useStudio(studioId);
  const { data: productions } = useProductions(studioId);
  const { data: sessions } = useSessions(studioId);
  const { canCreateProductions, canCreateSessions, canManageMembers } = useStudioRole(studioId);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const upcomingSessions = (sessions || []).filter(s =>
    isSessionVisibleOnDashboard(s.scheduledAt, s.durationMinutes ?? 60)
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Find current or next session
  const now = new Date();
  const currentOrNextSession = upcomingSessions.find(s => {
    const start = new Date(s.scheduledAt);
    const end = new Date(start.getTime() + (s.durationMinutes || 60) * 60000);
    return end > now;
  });

  const recentProductions = productions?.slice(0, 5) || [];
  const recentSessions = sessions?.filter(s => new Date(s.scheduledAt) < now).slice(0, 5) || [];

  return (
    <PageSection className={cn("max-w-[1600px] mx-auto", animationsEnabled ? "animate-in fade-in duration-700" : "")}>
      <div className="flex flex-col gap-8">
        {/* Header with Animation Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {studio?.name || pt.dashboard.title}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              {animationsEnabled ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
              {animationsEnabled ? "Animações ON" : "Animações OFF"}
            </button>

            <div className="flex gap-2">
              {canCreateProductions && (
                <Button size="sm" className="gap-1.5 vhub-btn-sm vhub-btn-primary shadow-lg shadow-primary/20" asChild>
                  <Link href={`/studio/${studioId}/productions`}>
                    <Plus className="h-3.5 w-3.5" /> {pt.dashboard.production}
                  </Link>
                </Button>
              )}
              {canCreateSessions && (
                <Button size="sm" variant="outline" className="gap-1.5 border-white/10 hover:bg-white/5" asChild>
                  <Link href={`/studio/${studioId}/sessions`}>
                    <Clock className="h-3.5 w-3.5" /> {pt.dashboard.session}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section: Current/Next Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current/Next Production Card */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6",
            animationsEnabled && "transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 group"
          )}>
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Film className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Produção em Destaque
                  </span>
                </div>
                {currentOrNextSession ? (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-1">{currentOrNextSession.title || "Produção Sem Nome"}</h2>
                    <p className="text-white/60 text-sm line-clamp-2">Sessão agendada</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-1">Sem produção ativa</h2>
                    <p className="text-white/60 text-sm">Nenhuma sessão agendada para hoje.</p>
                  </>
                )}
              </div>

              {currentOrNextSession && (
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <Clock className="w-4 h-4 text-primary" />
                    {new Date(currentOrNextSession.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <Calendar className="w-4 h-4 text-primary" />
                    {new Date(currentOrNextSession.scheduledAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Sessions List */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-6 flex flex-col",
            animationsEnabled && "transition-all duration-300 hover:border-white/20"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                Próximas Sessões
              </h3>
              <Link href={`/studio/${studioId}/sessions`} className="text-xs text-primary hover:underline">
                Ver agenda
              </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.slice(0, 3).map(session => (
                  <SessionCard key={session.id} session={session} studioId={studioId} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8 text-white/40">
                  <Calendar className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma sessão futura agendada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white/80 border-b border-white/10 pb-4">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Histórico Recente</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Productions (Non-clickable) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Últimas Produções</h3>
              <div className="space-y-2">
                {recentProductions.length > 0 ? (
                  recentProductions.map(prod => (
                    <div 
                      key={prod.id} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]",
                        animationsEnabled && "transition-all hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Film className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{prod.name}</p>
                        <p className="text-xs text-white/40 truncate">
                          Produção
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-medium border",
                          prod.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                          prod.status === 'completed' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-white/5 text-white/40 border-white/10"
                        )}>
                          {prod.status === 'active' ? 'Ativo' : prod.status === 'completed' ? 'Concluído' : 'Arquivado'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/40 italic">Nenhuma produção recente.</p>
                )}
              </div>
            </div>

            {/* Recent Sessions (Clickable) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Últimas Sessões Realizadas</h3>
              <div className="space-y-2">
                {recentSessions.length > 0 ? (
                  recentSessions.map(session => (
                    <Link 
                      key={session.id} 
                      href={`/studio/${studioId}/sessions/${session.id}`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] group",
                        animationsEnabled && "transition-all hover:bg-white/[0.04] hover:border-primary/20 hover:translate-x-1"
                      )}
                    >
                      <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                        <Clock className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate group-hover:text-primary transition-colors">{session.title}</p>
                        <p className="text-xs text-white/40 truncate">
                          {new Date(session.scheduledAt).toLocaleDateString()} • Sessão
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-white/40 italic">Nenhuma sessão realizada recentemente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  );
});

export default Dashboard;
