import { Switch, Route, Redirect, Router as WouterRouter, useSearch } from "wouter";
import { memoryHook, memorySearchHook } from "@/lib/memory-router";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useStudios } from "@/hooks/use-studios";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { BackButton } from "@/components/nav/BackButton";

const Landing = lazy(() => import("@/pages/landing"));
const Login = lazy(() => import("@/pages/login"));
const SecretariaLogin = lazy(() => import("@/pages/secretaria-login"));
const StudioSelect = lazy(() => import("@/pages/studio-select"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Productions = lazy(() => import("@/pages/productions"));
const Sessions = lazy(() => import("@/pages/sessions"));
const RecordingRoom = lazy(() => import("@/pages/room").then(module => ({ default: module.default })));
const Staff = lazy(() => import("@/pages/staff"));
const Admin = lazy(() => import("@/pages/admin"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Members = lazy(() => import("@/pages/members"));
const StudioAdmin = lazy(() => import("@/pages/studio-admin"));
const Takes = lazy(() => import("@/pages/takes"));
const Profile = lazy(() => import("@/pages/profile"));
const Daw = lazy(() => import("@/pages/daw"));

import { StudioLayout } from "@/components/layout/studio-layout";

function ProtectedRoute({ component: Component, requireStudio = false, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  if (requireStudio) {
    const studioId = rest.params?.studioId as string;
    return (
      <StudioLayout studioId={studioId}>
        <ErrorBoundary>
          <Component studioId={studioId} {...rest} />
        </ErrorBoundary>
      </StudioLayout>
    );
  }

  return (
    <ErrorBoundary>
      <Component {...rest} />
    </ErrorBoundary>
  );
}

function StudioSelectRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  return <StudioSelect />;
}

function DawRoute() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: studios, isLoading: isStudiosLoading } = useStudios();
  const search = useSearch();

  if (isAuthLoading || isStudiosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  const searchParams = new URLSearchParams(search || "");
  const studioIdFromQuery = searchParams.get("studioId");
  const availableStudios = studios || [];
  const resolvedStudioId = availableStudios.find((studio) => studio.id === studioIdFromQuery)?.id || availableStudios[0]?.id;

  if (!resolvedStudioId) {
    return <Redirect to="/studios" replace />;
  }

  return (
    <StudioLayout studioId={resolvedStudioId}>
      <ErrorBoundary>
        <Daw studioId={resolvedStudioId} />
      </ErrorBoundary>
    </StudioLayout>
  );
}

function Router() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/secretaria/login" component={SecretariaLogin} />
        <Route path="/studios" component={StudioSelectRoute} />

        <Route path="/admin">
          {() => <ProtectedRoute component={Admin} />}
        </Route>

        <Route path="/profile">
          {() => <ProtectedRoute component={Profile} />}
        </Route>
        <Route path="/daw">
          {() => <DawRoute />}
        </Route>

        <Route path="/studio/:studioId/dashboard">
          {params => <ProtectedRoute component={Dashboard} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/productions">
          {params => <ProtectedRoute component={Productions} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/sessions">
          {params => <ProtectedRoute component={Sessions} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/staff">
          {params => <ProtectedRoute component={Staff} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/members">
          {params => <ProtectedRoute component={Members} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/notifications">
          {params => <ProtectedRoute component={Notifications} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/takes">
          {params => <ProtectedRoute component={Takes} requireStudio params={params} />}
        </Route>
        <Route path="/studio/:studioId/admin">
          {params => <ProtectedRoute component={StudioAdmin} requireStudio params={params} />}
        </Route>

        <Route path="/studio/:studioId/sessions/:sessionId/room">
          {params => <ProtectedRoute component={RecordingRoom} params={params} />}
        </Route>

        <Route path="/hubdub/:rest*">{() => <Redirect to="/" replace />}</Route>
        <Route path="/thehub/:rest*">{() => <Redirect to="/" replace />}</Route>
        <Route path="/:rest*">{() => <Redirect to="/" replace />}</Route>
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <WouterRouter hook={memoryHook} searchHook={memorySearchHook}>
            <Toaster />
            <BackButton />
            <Router />
          </WouterRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
