import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import EventSessions from "@/pages/event-sessions";
import ScoreEntry from "@/pages/score-entry";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <Route path="/" component={() => (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )} />
      ) : !isAuthenticated ? (
        <Route path="/" component={Auth} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/events/:id" component={EventSessions} />
          <Route path="/sessions/:sessionId/score" component={ScoreEntry} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
