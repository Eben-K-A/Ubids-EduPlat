import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, BookOpen, GraduationCap, Activity, TrendingUp,
  AlertTriangle, ShieldCheck, ArrowRight, UserPlus, FileWarning, Server,
  Building2, Landmark, FolderTree, Video, Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { faculties, getAllDepartments, getAllPrograms } from "@/types/academic";
import { format, addHours } from "date-fns";

const enrollmentTrend = [
  { month: "Sep", students: 120, lecturers: 12 },
  { month: "Oct", students: 185, lecturers: 14 },
  { month: "Nov", students: 240, lecturers: 16 },
  { month: "Dec", students: 210, lecturers: 16 },
  { month: "Jan", students: 310, lecturers: 19 },
  { month: "Feb", students: 380, lecturers: 22 },
];

const courseDistribution = [
  { name: "Computer Science", value: 35 },
  { name: "Mathematics", value: 20 },
  { name: "Engineering", value: 25 },
  { name: "Business", value: 15 },
  { name: "Arts", value: 5 },
];

const COLORS = [
  "hsl(243,75%,59%)", "hsl(173,80%,40%)", "hsl(38,92%,50%)",
  "hsl(142,76%,36%)", "hsl(0,84%,60%)",
];

const recentActivity = [
  { id: 1, action: "New lecturer registered", user: "Dr. Sarah Chen", time: "12 min ago", type: "user" },
  { id: 2, action: "Course flagged for review", user: "System", time: "1 hour ago", type: "flag" },
  { id: 3, action: "Bulk enrollment completed", user: "Admin", time: "2 hours ago", type: "enrollment" },
  { id: 4, action: "System backup completed", user: "System", time: "4 hours ago", type: "system" },
  { id: 5, action: "New student registration spike", user: "System", time: "6 hours ago", type: "alert" },
];

const upcomingMeetings = [
  { id: "m1", title: "Faculty Board Meeting", time: addHours(new Date(), 3), participants: 15 },
  { id: "m2", title: "IT Infrastructure Review", time: addHours(new Date(), 6), participants: 8 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Badge className="bg-warning/10 text-warning border-warning/30">Administrator</Badge>
        </div>
        <p className="text-muted-foreground">
          Platform overview and system monitoring
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              <span>+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              <span>+8 new this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Lecturers</CardTitle>
            <GraduationCap className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              <span>+3 this semester</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>All systems operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Structure + Live Meetings */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/academic")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><Landmark className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{faculties.length}</p>
                <p className="text-xs text-muted-foreground">Faculties</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/academic")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10"><Building2 className="h-5 w-5 text-accent" /></div>
              <div>
                <p className="text-2xl font-bold">{getAllDepartments().length}</p>
                <p className="text-xs text-muted-foreground">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/academic")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10"><FolderTree className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold">{getAllPrograms().length}</p>
                <p className="text-xs text-muted-foreground">Programs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/meetings")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/10"><Video className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
                <p className="text-xs text-muted-foreground">Live Meetings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enrollment Trends</CardTitle>
            <CardDescription>Student and lecturer registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(220,9%,46%)" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(220,9%,46%)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area type="monotone" dataKey="students" stroke="hsl(243,75%,59%)" fill="hsl(243,75%,59%,0.15)" name="Students" />
                <Area type="monotone" dataKey="lecturers" stroke="hsl(173,80%,40%)" fill="hsl(173,80%,40%,0.15)" name="Lecturers" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses by Department</CardTitle>
            <CardDescription>Distribution of active courses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={courseDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {courseDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {courseDistribution.map((dept, i) => (
                <div key={dept.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{dept.name}</span>
                  </div>
                  <span className="font-medium">{dept.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/moderation")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-lg ${
                    item.type === "flag" ? "bg-destructive/10" :
                    item.type === "alert" ? "bg-warning/10" :
                    item.type === "user" ? "bg-primary/10" :
                    item.type === "enrollment" ? "bg-success/10" :
                    "bg-muted"
                  }`}>
                    {item.type === "flag" ? <FileWarning className="h-4 w-4 text-destructive" /> :
                     item.type === "alert" ? <AlertTriangle className="h-4 w-4 text-warning" /> :
                     item.type === "user" ? <UserPlus className="h-4 w-4 text-primary" /> :
                     item.type === "enrollment" ? <GraduationCap className="h-4 w-4 text-success" /> :
                     <Server className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.user} · {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate("/admin/users")}>
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm">Manage Users</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate("/admin/moderation")}>
                <FileWarning className="h-6 w-6 text-warning" />
                <span className="text-sm">Content Moderation</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate("/admin/system-settings")}>
                <Server className="h-6 w-6 text-accent" />
                <span className="text-sm">System Settings</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-6" onClick={() => navigate("/analytics")}>
                <TrendingUp className="h-6 w-6 text-success" />
                <span className="text-sm">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}