import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import LinkedInLayout from "@/components/LinkedInLayout";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AchievementsPage from "@/pages/achievements-page";
import ReviewPage from "@/pages/review-page";
import FormsPage from "@/pages/forms-page";
import AnalyticsPage from "@/pages/analytics-page";
import UsersPage from "@/pages/users-page";
import StudentFormsPage from "@/pages/student-forms-page";
import SocialFeedPage from "@/pages/social-feed-page";
import LeetCodePage from "@/pages/leetcode-page";
import LeetCodeProblemPage from "@/pages/leetcode-problem-page";
import LeetCodeCreatePage from "@/pages/leetcode-create-page";

// Wrapper components to ensure they always return an element
const HomeWrapper = () => {
  return <HomePage />;
};

const AchievementsWrapper = () => {
  return <AchievementsPage />;
};

const ReviewWrapper = () => {
  return <ReviewPage />;
};

const FormsWrapper = () => {
  return <FormsPage />;
};

const StudentFormsWrapper = () => {
  return <StudentFormsPage />;
};

const AnalyticsWrapper = () => {
  return <AnalyticsPage />;
};

const UsersWrapper = () => {
  return <UsersPage />;
};

const SocialFeedWrapper = () => {
  return <SocialFeedPage />;
};

const LeetCodeWrapper = () => {
  return <LeetCodePage />;
};

const LeetCodeProblemWrapper = () => {
  return <LeetCodeProblemPage />;
};

const LeetCodeCreateWrapper = () => {
  return <LeetCodeCreatePage />;
};

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomeWrapper} />
      <ProtectedRoute path="/achievements" component={AchievementsWrapper} roles={['student']} />
      <ProtectedRoute path="/review" component={ReviewWrapper} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/forms" component={FormsWrapper} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/student/forms" component={StudentFormsWrapper} roles={['student']} />
      <ProtectedRoute path="/analytics" component={AnalyticsWrapper} roles={['hod']} />
      <ProtectedRoute path="/users" component={UsersWrapper} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/feed" component={SocialFeedWrapper} roles={['student']} />
      <ProtectedRoute path="/leetcode" component={LeetCodeWrapper} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/leetcode/problems/:id" component={LeetCodeProblemWrapper} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/leetcode/create" component={LeetCodeCreateWrapper} roles={['faculty', 'hod']} />
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