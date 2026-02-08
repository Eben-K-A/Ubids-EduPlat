import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/contexts/CourseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Users,
  Mail,
  MoreVertical,
  UserCircle,
  FileText,
  Award,
  TrendingUp,
} from "lucide-react";

// Mock students data
const mockStudents = [
  {
    id: "s1",
    name: "Alex Thompson",
    email: "alex.t@university.edu",
    enrolledCourses: 3,
    avgScore: 92,
    submissions: 12,
    lastActive: "2 hours ago",
    status: "active",
  },
  {
    id: "s2",
    name: "Jamie Wilson",
    email: "jamie.w@university.edu",
    enrolledCourses: 2,
    avgScore: 85,
    submissions: 8,
    lastActive: "1 day ago",
    status: "active",
  },
  {
    id: "s3",
    name: "Morgan Lee",
    email: "morgan.l@university.edu",
    enrolledCourses: 4,
    avgScore: 78,
    submissions: 15,
    lastActive: "3 hours ago",
    status: "active",
  },
  {
    id: "s4",
    name: "Casey Brown",
    email: "casey.b@university.edu",
    enrolledCourses: 2,
    avgScore: 65,
    submissions: 5,
    lastActive: "1 week ago",
    status: "at-risk",
  },
  {
    id: "s5",
    name: "Riley Davis",
    email: "riley.d@university.edu",
    enrolledCourses: 3,
    avgScore: 88,
    submissions: 10,
    lastActive: "5 hours ago",
    status: "active",
  },
  {
    id: "s6",
    name: "Jordan Martinez",
    email: "jordan.m@university.edu",
    enrolledCourses: 1,
    avgScore: 45,
    submissions: 2,
    lastActive: "2 weeks ago",
    status: "at-risk",
  },
];

export default function Students() {
  const { user } = useAuth();
  const { getMyCourses } = useCourses();
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const myCourses = getMyCourses();

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalStudents = mockStudents.length;
  const activeStudents = mockStudents.filter((s) => s.status === "active").length;
  const atRiskStudents = mockStudents.filter((s) => s.status === "at-risk").length;
  const avgClassScore = Math.round(
    mockStudents.reduce((acc, s) => acc + s.avgScore, 0) / mockStudents.length
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage and monitor student performance across your courses
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Students
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((activeStudents / totalStudents) * 100)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                At Risk
              </CardTitle>
              <Users className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{atRiskStudents}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Class Average
              </CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgClassScore}%</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {myCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Avg. Score</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.enrolledCourses}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={student.avgScore}
                          className="w-16 h-2"
                        />
                        <span className="text-sm">{student.avgScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.submissions}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {student.lastActive}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={student.status === "active" ? "default" : "destructive"}
                      >
                        {student.status === "active" ? "Active" : "At Risk"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <UserCircle className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            View Submissions
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Award className="h-4 w-4 mr-2" />
                            View Grades
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
