import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield, UserCog, FileWarning, Settings, LogIn, LogOut,
  Trash2, CheckCircle, XCircle, Clock, Search, Filter,
  Download, UserPlus, BookOpen, AlertTriangle, Eye,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: "admin" | "lecturer" | "student";
  action: string;
  category: "auth" | "role_change" | "moderation" | "course" | "user_management" | "system";
  target?: string;
  details: string;
  severity: "info" | "warning" | "critical";
  ipAddress: string;
}

const auditData: AuditEntry[] = [
  { id: "1", timestamp: "2026-02-07 14:32:15", user: "Admin User", userRole: "admin", action: "Role Changed", category: "role_change", target: "Jane Doe", details: "Changed role from 'student' to 'lecturer'", severity: "warning", ipAddress: "192.168.1.10" },
  { id: "2", timestamp: "2026-02-07 14:15:03", user: "Admin User", userRole: "admin", action: "Content Removed", category: "moderation", target: "Discussion #482", details: "Removed flagged discussion post for harassment", severity: "critical", ipAddress: "192.168.1.10" },
  { id: "3", timestamp: "2026-02-07 13:45:22", user: "Dr. Smith", userRole: "lecturer", action: "Course Published", category: "course", target: "Advanced AI Ethics", details: "Published new course with 12 modules", severity: "info", ipAddress: "10.0.0.55" },
  { id: "4", timestamp: "2026-02-07 12:30:00", user: "Admin User", userRole: "admin", action: "User Suspended", category: "user_management", target: "User456", details: "Account suspended for policy violations", severity: "critical", ipAddress: "192.168.1.10" },
  { id: "5", timestamp: "2026-02-07 11:20:18", user: "Admin User", userRole: "admin", action: "Content Approved", category: "moderation", target: "Intro to ML — Module 3", details: "Approved flagged course content after review", severity: "info", ipAddress: "192.168.1.10" },
  { id: "6", timestamp: "2026-02-07 10:05:44", user: "Prof. Wilson", userRole: "lecturer", action: "Login", category: "auth", details: "Successful login from new device", severity: "info", ipAddress: "172.16.0.88" },
  { id: "7", timestamp: "2026-02-07 09:55:30", user: "Admin User", userRole: "admin", action: "System Setting Updated", category: "system", details: "Changed max file upload size from 10MB to 25MB", severity: "warning", ipAddress: "192.168.1.10" },
  { id: "8", timestamp: "2026-02-06 22:10:05", user: "Student123", userRole: "student", action: "Failed Login", category: "auth", details: "5 consecutive failed login attempts — account locked", severity: "critical", ipAddress: "203.0.113.42" },
  { id: "9", timestamp: "2026-02-06 18:40:12", user: "Admin User", userRole: "admin", action: "User Activated", category: "user_management", target: "Dr. Alan Park", details: "Approved new lecturer registration", severity: "info", ipAddress: "192.168.1.10" },
  { id: "10", timestamp: "2026-02-06 16:22:33", user: "Admin User", userRole: "admin", action: "Course Rejected", category: "moderation", target: "Quantum Computing Basics", details: "Sent back for revision — incomplete syllabus", severity: "warning", ipAddress: "192.168.1.10" },
  { id: "11", timestamp: "2026-02-06 14:05:00", user: "Admin User", userRole: "admin", action: "Bulk User Import", category: "user_management", details: "Imported 45 new student accounts from CSV", severity: "info", ipAddress: "192.168.1.10" },
  { id: "12", timestamp: "2026-02-06 11:30:15", user: "Admin User", userRole: "admin", action: "Role Changed", category: "role_change", target: "Michael Brown", details: "Changed role from 'student' to 'admin'", severity: "critical", ipAddress: "192.168.1.10" },
  { id: "13", timestamp: "2026-02-05 20:15:42", user: "System", userRole: "admin", action: "Automated Backup", category: "system", details: "Nightly database backup completed successfully", severity: "info", ipAddress: "127.0.0.1" },
  { id: "14", timestamp: "2026-02-05 09:00:00", user: "Admin User", userRole: "admin", action: "Announcement Published", category: "system", details: "Published system-wide maintenance announcement for Feb 10", severity: "info", ipAddress: "192.168.1.10" },
];

function getCategoryIcon(category: AuditEntry["category"]) {
  switch (category) {
    case "auth": return LogIn;
    case "role_change": return UserCog;
    case "moderation": return FileWarning;
    case "course": return BookOpen;
    case "user_management": return UserPlus;
    case "system": return Settings;
  }
}

function getCategoryColor(category: AuditEntry["category"]) {
  switch (category) {
    case "auth": return "bg-primary/10 text-primary";
    case "role_change": return "bg-warning/10 text-warning";
    case "moderation": return "bg-destructive/10 text-destructive";
    case "course": return "bg-accent/10 text-accent";
    case "user_management": return "bg-success/10 text-success";
    case "system": return "bg-muted text-muted-foreground";
  }
}

function getSeverityBadge(severity: AuditEntry["severity"]) {
  switch (severity) {
    case "critical": return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Critical</Badge>;
    case "warning": return <Badge className="bg-warning/10 text-warning border-warning/30">Warning</Badge>;
    case "info": return <Badge className="bg-muted text-muted-foreground">Info</Badge>;
  }
}

function getCategoryLabel(category: AuditEntry["category"]) {
  switch (category) {
    case "auth": return "Authentication";
    case "role_change": return "Role Change";
    case "moderation": return "Moderation";
    case "course": return "Course";
    case "user_management": return "User Mgmt";
    case "system": return "System";
  }
}

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = auditData.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.target?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || entry.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const criticalCount = auditData.filter((e) => e.severity === "critical").length;
  const todayCount = auditData.filter((e) => e.timestamp.startsWith("2026-02-07")).length;
  const roleChanges = auditData.filter((e) => e.category === "role_change").length;
  const moderationActions = auditData.filter((e) => e.category === "moderation").length;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
        <p className="text-muted-foreground">Track all user actions, role changes, and moderation decisions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted"><Eye className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Actions Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/10"><UserCog className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold">{roleChanges}</p>
                <p className="text-xs text-muted-foreground">Role Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{moderationActions}</p>
                <p className="text-xs text-muted-foreground">Moderation Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="role_change">Role Changes</SelectItem>
                <SelectItem value="moderation">Moderation</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="user_management">User Management</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Showing {filtered.length} of {auditData.length} entries</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filtered.map((entry) => {
                const Icon = getCategoryIcon(entry.category);
                return (
                  <div
                    key={entry.id}
                    className={`flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border ${
                      entry.severity === "critical" ? "border-destructive/30 bg-destructive/5" : ""
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 self-start ${getCategoryColor(entry.category)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">{entry.action}</span>
                        {getSeverityBadge(entry.severity)}
                        <Badge variant="outline" className="text-[10px]">{getCategoryLabel(entry.category)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.details}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <UserCog className="h-3 w-3" /> {entry.user}
                          <Badge variant="secondary" className="text-[10px] ml-1 capitalize">{entry.userRole}</Badge>
                        </span>
                        {entry.target && (
                          <span className="flex items-center gap-1">
                            Target: <span className="font-medium text-foreground">{entry.target}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {entry.timestamp}</span>
                        <span className="text-muted-foreground/60">IP: {entry.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No matching entries</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}