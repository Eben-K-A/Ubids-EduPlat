import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CourseProvider } from "@/contexts/CourseContext";
import { AssignmentProvider } from "@/contexts/AssignmentContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AcademicProvider } from "@/contexts/AcademicContext";
import { ClassroomProvider } from "@/contexts/ClassroomContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import MyCourses from "./pages/MyCourses";
import Enrollments from "./pages/Enrollments";
import Assignments from "./pages/Assignments";
import Quizzes from "./pages/Quizzes";
import QuizAttempt from "./pages/QuizAttempt";
import Analytics from "./pages/Analytics";
import Messages from "./pages/Messages";
import Students from "./pages/Students";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import FileManagement from "./pages/FileManagement";
import Discussions from "./pages/Discussions";
import AIServices from "./pages/AIServices";
import Notifications from "./pages/Notifications";
import LessonPlayer from "./pages/LessonPlayer";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import GradingSystem from "./pages/GradingSystem";
import MeetingRoom from "./pages/MeetingRoom";
import Meetings from "./pages/Meetings";
import MyGrades from "./pages/MyGrades";
import ProctoredExam from "./pages/ProctoredExam";
import TodoCalendar from "./pages/TodoCalendar";
import JoinClass from "./pages/JoinClass";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ContentModeration from "./pages/admin/ContentModeration";
import AuditLog from "./pages/admin/AuditLog";
import SystemSettings from "./pages/admin/SystemSettings";
import AcademicManagement from "./pages/admin/AcademicManagement";
import LecturerProfile from "./pages/LecturerProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AcademicProvider>
        <CourseProvider>
          <AssignmentProvider>
            <ClassroomProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/courses"
                      element={
                        <ProtectedRoute>
                          <Courses />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/courses/:courseId"
                      element={
                        <ProtectedRoute>
                          <CourseDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/courses/:courseId/learn"
                      element={
                        <ProtectedRoute>
                          <LessonPlayer />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-courses"
                      element={
                        <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                          <MyCourses />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/enrollments"
                      element={
                        <ProtectedRoute allowedRoles={["student"]}>
                          <Enrollments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assignments"
                      element={
                        <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                          <Assignments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-assignments"
                      element={
                        <ProtectedRoute allowedRoles={["student"]}>
                          <Assignments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quizzes"
                      element={
                        <ProtectedRoute>
                          <Quizzes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quizzes/:quizId"
                      element={
                        <ProtectedRoute allowedRoles={["student"]}>
                          <QuizAttempt />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/meetings"
                      element={
                        <ProtectedRoute>
                          <Meetings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/meetings/room/:meetingId?"
                      element={
                        <ProtectedRoute>
                          <MeetingRoom />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-grades"
                      element={
                        <ProtectedRoute allowedRoles={["student"]}>
                          <MyGrades />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <ProtectedRoute>
                          <Reports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/grading"
                      element={
                        <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                          <GradingSystem />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/proctored-exam/:quizId"
                      element={
                        <ProtectedRoute allowedRoles={["student"]}>
                          <ProctoredExam />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/discussions"
                      element={
                        <ProtectedRoute>
                          <Discussions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/files"
                      element={
                        <ProtectedRoute>
                          <FileManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ai"
                      element={
                        <ProtectedRoute>
                          <AIServices />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students"
                      element={
                        <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                          <Students />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/help"
                      element={
                        <ProtectedRoute>
                          <Help />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/moderation"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <ContentModeration />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/system-settings"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <SystemSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/audit-log"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AuditLog />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/academic"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AcademicManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/lecturer-profile"
                      element={
                        <ProtectedRoute allowedRoles={["lecturer"]}>
                          <LecturerProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/todo"
                      element={
                        <ProtectedRoute>
                          <TodoCalendar />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/join-class"
                      element={
                        <ProtectedRoute>
                          <JoinClass />
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
            </ClassroomProvider>
          </AssignmentProvider>
        </CourseProvider>
        </AcademicProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
