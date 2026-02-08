import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search, Filter, MoreHorizontal, UserPlus, Mail, Ban, Eye,
  Shield, GraduationCap, Users, CheckCircle, XCircle, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "lecturer" | "admin";
  status: "active" | "suspended" | "pending";
  joinedAt: string;
  lastActive: string;
  coursesCount: number;
}

const mockUsers: MockUser[] = [
  { id: "1", firstName: "John", lastName: "Smith", email: "john.smith@edu.com", role: "lecturer", status: "active", joinedAt: "2024-08-15", lastActive: "2 hours ago", coursesCount: 5 },
  { id: "2", firstName: "Jane", lastName: "Doe", email: "jane.doe@edu.com", role: "student", status: "active", joinedAt: "2024-09-01", lastActive: "30 min ago", coursesCount: 4 },
  { id: "3", firstName: "Michael", lastName: "Brown", email: "m.brown@edu.com", role: "student", status: "suspended", joinedAt: "2024-09-10", lastActive: "3 days ago", coursesCount: 2 },
  { id: "4", firstName: "Sarah", lastName: "Chen", email: "s.chen@edu.com", role: "lecturer", status: "active", joinedAt: "2024-07-20", lastActive: "1 hour ago", coursesCount: 3 },
  { id: "5", firstName: "David", lastName: "Wilson", email: "d.wilson@edu.com", role: "student", status: "pending", joinedAt: "2025-02-05", lastActive: "Never", coursesCount: 0 },
  { id: "6", firstName: "Emily", lastName: "Taylor", email: "e.taylor@edu.com", role: "student", status: "active", joinedAt: "2024-10-12", lastActive: "5 hours ago", coursesCount: 6 },
  { id: "7", firstName: "Robert", lastName: "Garcia", email: "r.garcia@edu.com", role: "lecturer", status: "active", joinedAt: "2024-06-01", lastActive: "20 min ago", coursesCount: 7 },
  { id: "8", firstName: "Anna", lastName: "Martinez", email: "a.martinez@edu.com", role: "student", status: "active", joinedAt: "2024-11-01", lastActive: "1 day ago", coursesCount: 3 },
];

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalStudents = mockUsers.filter((u) => u.role === "student").length;
  const totalLecturers = mockUsers.filter((u) => u.role === "lecturer").length;
  const suspendedUsers = mockUsers.filter((u) => u.status === "suspended").length;
  const pendingUsers = mockUsers.filter((u) => u.status === "pending").length;

  const handleAction = (action: string, user: MockUser) => {
    toast({
      title: `${action} - ${user.firstName} ${user.lastName}`,
      description: `Action "${action}" performed successfully.`,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-warning/10 text-warning border-warning/30">Admin</Badge>;
      case "lecturer": return <Badge className="bg-primary/10 text-primary border-primary/30">Lecturer</Badge>;
      case "student": return <Badge className="bg-accent/10 text-accent border-accent/30">Student</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case "suspended": return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Suspended</Badge>;
      case "pending": return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage students, lecturers, and admin accounts</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{mockUsers.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10"><GraduationCap className="h-5 w-5 text-accent" /></div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10"><Shield className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold">{totalLecturers}</p>
                <p className="text-xs text-muted-foreground">Lecturers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10"><Ban className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold">{suspendedUsers}</p>
                <p className="text-xs text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>{filteredUsers.length} users found</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" /> Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="lecturer">Lecturer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Courses</TableHead>
                  <TableHead className="hidden md:table-cell">Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.coursesCount}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setViewDialogOpen(true); }}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Send Email", user)}>
                            <Mail className="h-4 w-4 mr-2" /> Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "suspended" ? (
                            <DropdownMenuItem onClick={() => handleAction("Reactivate", user)}>
                              <CheckCircle className="h-4 w-4 mr-2" /> Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleAction("Suspend", user)}>
                              <Ban className="h-4 w-4 mr-2" /> Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleAction("Delete", user)}>
                            <XCircle className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Full profile information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div><p className="text-xs text-muted-foreground">Joined</p><p className="font-medium text-sm">{selectedUser.joinedAt}</p></div>
                <div><p className="text-xs text-muted-foreground">Last Active</p><p className="font-medium text-sm">{selectedUser.lastActive}</p></div>
                <div><p className="text-xs text-muted-foreground">Courses</p><p className="font-medium text-sm">{selectedUser.coursesCount}</p></div>
                <div><p className="text-xs text-muted-foreground">Role</p><p className="font-medium text-sm capitalize">{selectedUser.role}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => { handleAction("Edit", selectedUser!); setViewDialogOpen(false); }}>Edit User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input placeholder="First name" /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Last name" /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="user@edu.com" /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="student">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "User created", description: "Invitation email sent." }); setAddDialogOpen(false); }}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}