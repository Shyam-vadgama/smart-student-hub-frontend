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
import QuizPage from "@/pages/quiz-page";
import CircuitDesignPage from "@/pages/circuit-design-page";
import CircuitProblemsPage from "@/pages/circuit-problems-page";
import CircuitSubmissionsPage from "@/pages/circuit-submissions-page";
import QuizTakePage from "@/pages/quiz-take-page";
import QuizSubmissionsPage from "@/pages/quiz-submissions-page";
import ResumeBuilderLandingPage from "@/pages/resume-builder-landing";
import ResumeBuilderCreatePage from "@/pages/resume-builder-create";
import StockTradingPage from "@/pages/stock-trading-page";

import ForgotPasswordPage from "@/pages/forgot-password-page"; // Import the new component
import BusinessProblemsPage from "@/pages/business-problems-page";
import BusinessProblemCreatePage from "@/pages/business-problem-create-page"; // Import the new component
import BusinessProblemSubmissionsPage from "@/pages/business-problem-submissions-page"; // Import the new component
import CreateCollege from "@/pages/CreateCollege";
import CreateDepartment from "@/pages/CreateDepartment";
import CreateClassroom from "@/pages/CreateClassroom";
import CreateSubject from "@/pages/CreateSubject";
import AdminDashboard from "@/pages/AdminDashboard";
import CollegeDetails from "@/pages/CollegeDetails";
import ResetPassword from "@/pages/ResetPassword";
import FacultyDashboard from "@/pages/FacultyDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import HODDashboard from "@/pages/HODDashboard";
import AttendancePage from "@/pages/attendance-page";


// Wrapper components to ensure they always return an element
const HomeWrapper = () => {
  return <HomePage />;
};

const BusinessProblemCreateWrapper = () => { // New wrapper component
  return <BusinessProblemCreatePage />;
};

const BusinessProblemSubmissionsWrapper = () => { // New wrapper component
  return <BusinessProblemSubmissionsPage />;
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

const StockTradingWrapper = () => {
  return <StockTradingPage />;
};

const BusinessProblemsWrapper = () => {
  return <BusinessProblemsPage />;
};

const CreateCollegeWrapper = () => {
  return <CreateCollege />;
};

const CreateDepartmentWrapper = () => {
  return <CreateDepartment />;
};

const CreateClassroomWrapper = () => {
  return <CreateClassroom />;
};

const CreateSubjectWrapper = () => {
  return <CreateSubject />;
};

const AdminDashboardWrapper = () => {
  return <AdminDashboard />;
};

const CollegeDetailsWrapper = () => {
  return <CollegeDetails />;
};

const ResetPasswordWrapper = () => {
  return <ResetPassword />;
};

const FacultyDashboardWrapper = () => {
  return <FacultyDashboard />;
};

const StudentDashboardWrapper = () => {
  return <StudentDashboard />;
};

const HODDashboardWrapper = () => {
  return <HODDashboard />;
};

const AttendanceWrapper = () => {
  return <AttendancePage />;
};




function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/resume-builder" component={ResumeBuilderLandingPage} roles={['student','faculty','hod']} />
      <ProtectedRoute path="/resume-builder/create" component={ResumeBuilderCreatePage} roles={['student','faculty','hod']} />
      <ProtectedRoute path="/resume-builder/edit/:id" component={ResumeBuilderCreatePage} roles={['student','faculty','hod']} />
      <ProtectedRoute path="/" component={HomeWrapper} />
      <ProtectedRoute path="/achievements" component={AchievementsWrapper} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/review" component={ReviewWrapper} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/forms" component={FormsWrapper} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/student/forms" component={StudentFormsWrapper} roles={['student']} />
      <ProtectedRoute path="/analytics" component={AnalyticsWrapper} roles={['hod']} />
      <ProtectedRoute path="/users" component={UsersWrapper} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/feed" component={SocialFeedWrapper} roles={['student']} />
      <ProtectedRoute path="/leetcode" component={LeetCodeWrapper} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/leetcode/problems/:id" component={LeetCodeProblemWrapper} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/leetcode/create" component={LeetCodeCreateWrapper} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/quiz" component={QuizPage} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/quiz/:id" component={QuizTakePage} roles={['student']} />
      <ProtectedRoute path="/quiz/:id/submissions" component={QuizSubmissionsPage} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/circuit" component={CircuitProblemsPage} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/circuit/:id" component={CircuitDesignPage} roles={['student', 'faculty', 'hod']} />
      <ProtectedRoute path="/circuit/:id/submissions" component={CircuitSubmissionsPage} roles={['faculty', 'hod']} />
      <ProtectedRoute path="/stock-trading" component={StockTradingWrapper} roles={['student']} />
      <ProtectedRoute path="/business-problems" component={BusinessProblemsWrapper} roles={['student','faculty','hod']} />
      <ProtectedRoute path="/business-problems/create" component={BusinessProblemCreateWrapper} roles={['faculty', 'hod']} /> {/* New route for creating business problems */}
      <ProtectedRoute path="/business-problems/:id/submissions" component={BusinessProblemSubmissionsWrapper} roles={['faculty', 'hod']} /> {/* New route for viewing submissions */}
      <ProtectedRoute path="/create-college" component={CreateCollegeWrapper} roles={['shiksan_mantri']} />
      <ProtectedRoute path="/create-department" component={CreateDepartmentWrapper} roles={['principal']} />
      <ProtectedRoute path="/create-classroom" component={CreateClassroomWrapper} roles={['hod']} />
      <ProtectedRoute path="/create-subject" component={CreateSubjectWrapper} roles={['hod']} />
      <ProtectedRoute path="/admin-dashboard" component={AdminDashboardWrapper} roles={['shiksan_mantri']} />
      <ProtectedRoute path="/college/:id" component={CollegeDetailsWrapper} roles={['shiksan_mantri', 'principal']} />
      <Route path="/reset-password/:token" component={ResetPasswordWrapper} />
      <ProtectedRoute path="/faculty-dashboard" component={FacultyDashboardWrapper} roles={['faculty']} />
      <ProtectedRoute path="/student-dashboard" component={StudentDashboardWrapper} roles={['student']} />
      <ProtectedRoute path="/hod-dashboard" component={HODDashboardWrapper} roles={['hod']} />
      <ProtectedRoute path="/attendance" component={AttendanceWrapper} roles={['faculty']} />
      
      
      <Route path="/forgot-password" component={ForgotPasswordPage} /> {/* New route for forgot password */}
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