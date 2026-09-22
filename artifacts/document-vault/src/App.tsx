import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/vault-ui';
import Admin from '@/pages/admin';
import Dashboard from '@/pages/dashboard';
import DocumentDetail from '@/pages/document-detail';
import Documents from '@/pages/documents';
import Login from '@/pages/login';
import NotFound from '@/pages/not-found';
import Settings from '@/pages/settings';
import { useGetSession } from '@workspace/api-client-react';

const queryClient = new QueryClient();

function HomeRedirect() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetSession();
  useEffect(() => {
    if (!isLoading) setLocation(data?.authenticated ? '/dashboard' : '/login');
  }, [data?.authenticated, isLoading, setLocation]);
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><div className="skeleton h-2 w-24 rounded-full" data-testid="loading-home" /></div>;
}

function AdminRoute() {
  const [, setLocation] = useLocation();
  const session = useGetSession();
  useEffect(() => {
    if (!session.isLoading && session.data?.user?.role !== 'ADMIN') setLocation('/dashboard');
  }, [session.data, session.isLoading, setLocation]);
  if (session.isLoading || session.data?.user?.role !== 'ADMIN') return null;
  return <Admin />;
}

function ProtectedRoutes() {
  const [, setLocation] = useLocation();
  const session = useGetSession();
  useEffect(() => {
    if (!session.isLoading && session.data && !session.data.authenticated) setLocation('/login');
  }, [session.data, session.isLoading, setLocation]);
  if (!session.isLoading && session.data && !session.data.authenticated) return null;
  return (
    <AppShell>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/documents" component={Documents} />
        <Route path="/documents/:id" component={DocumentDetail} />
        <Route path="/settings" component={Settings} />
        <Route path="/admin" component={AdminRoute} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/login" component={Login} />
        <Route component={ProtectedRoutes} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;