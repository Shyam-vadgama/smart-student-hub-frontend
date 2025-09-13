import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AchievementsPage from "@/pages/achievements-page";
import ReviewPage from "@/pages/review-page";
import FormsPage from "@/pages/forms-page";
import AnalyticsPage from "@/pages/analytics-page";
import UsersPage from "@/pages/users-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} roles={['student']} />
      <ProtectedRoute path="/review" component={ReviewPage} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/forms" component={FormsPage} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} roles={['hod']} />
      <ProtectedRoute path="/users" component={UsersPage} roles={['hod']} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
