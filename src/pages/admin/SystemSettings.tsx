import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Settings, Bell, Globe, Shield, Database, Mail,
  Calendar, Megaphone, Save, Server, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SystemSettings() {
  const { toast } = useToast();

  const [platformName, setPlatformName] = useState("EduPlatform");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [selfRegistration, setSelfRegistration] = useState(true);
  const [emailVerification, setEmailVerification] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState("50");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [defaultRole, setDefaultRole] = useState("student");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);

  // Academic calendar
  const [semesterName, setSemesterName] = useState("Spring 2025");
  const [semesterStart, setSemesterStart] = useState("2025-01-15");
  const [semesterEnd, setSemesterEnd] = useState("2025-05-30");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState("daily");

  const handleSave = (section: string) => {
    toast({ title: "Settings saved", description: `${section} settings have been updated.` });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Settings</h1>
        <p className="text-muted-foreground">Configure platform settings, academic calendar, and system preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general"><Settings className="h-4 w-4 mr-1.5" /> General</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-1.5" /> Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="academic"><Calendar className="h-4 w-4 mr-1.5" /> Academic</TabsTrigger>
          <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 mr-1.5" /> Announcements</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Platform Configuration</CardTitle>
                <CardDescription>Core platform settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Default User Role</Label>
                    <Select value={defaultRole} onValueChange={setDefaultRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="lecturer">Lecturer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">Self Registration</p>
                    <p className="text-xs text-muted-foreground">Allow users to create their own accounts</p>
                  </div>
                  <Switch checked={selfRegistration} onCheckedChange={setSelfRegistration} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Disable access for non-admin users</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>
                <Button onClick={() => handleSave("General")}><Save className="h-4 w-4 mr-1.5" /> Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> System Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="font-semibold">v2.4.1</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Storage Used</p>
                    <p className="font-semibold">2.4 GB / 10 GB</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-semibold">99.8% (30 days)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security Settings</CardTitle>
              <CardDescription>Authentication and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Email Verification Required</p>
                  <p className="text-xs text-muted-foreground">Users must verify email before accessing platform</p>
                </div>
                <Switch checked={emailVerification} onCheckedChange={setEmailVerification} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Upload File Size (MB)</Label>
                  <Input type="number" value={maxFileSize} onChange={(e) => setMaxFileSize(e.target.value)} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <p className="font-medium text-sm">Password Policy</p>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline" className="text-xs">Min 8 chars</Badge>
                    <Badge variant="outline" className="text-xs">Uppercase</Badge>
                    <Badge variant="outline" className="text-xs">Number</Badge>
                    <Badge variant="outline" className="text-xs">Special char</Badge>
                  </div>
                </div>
              </div>
              <Button onClick={() => handleSave("Security")}><Save className="h-4 w-4 mr-1.5" /> Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Settings</CardTitle>
              <CardDescription>Configure platform-wide notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Send email notifications to users</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Send browser push notifications</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              <div className="space-y-2">
                <Label>Digest Frequency</Label>
                <Select value={digestFrequency} onValueChange={setDigestFrequency}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSave("Notifications")}><Save className="h-4 w-4 mr-1.5" /> Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Academic Calendar</CardTitle>
              <CardDescription>Manage semesters, terms, and academic periods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary/10 text-primary">Current Semester</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Semester Name</Label>
                    <Input value={semesterName} onChange={(e) => setSemesterName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={semesterStart} onChange={(e) => setSemesterStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={semesterEnd} onChange={(e) => setSemesterEnd(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Key Dates</h4>
                <div className="grid gap-2">
                  {[
                    { label: "Registration Deadline", date: "Jan 20, 2025" },
                    { label: "Midterm Exams", date: "Mar 10–14, 2025" },
                    { label: "Course Drop Deadline", date: "Mar 28, 2025" },
                    { label: "Final Exams", date: "May 19–30, 2025" },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm">{d.label}</span>
                      <Badge variant="outline">{d.date}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => handleSave("Academic")}><Save className="h-4 w-4 mr-1.5" /> Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Platform Announcements</CardTitle>
              <CardDescription>Create system-wide announcements visible to all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Active Announcement Banner</p>
                  <p className="text-xs text-muted-foreground">Show announcement across all pages</p>
                </div>
                <Switch checked={announcementActive} onCheckedChange={setAnnouncementActive} />
              </div>
              <div className="space-y-2">
                <Label>Announcement Message</Label>
                <Textarea
                  placeholder="Enter your announcement message..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Previous Announcements</h4>
                <div className="space-y-2">
                  {[
                    { text: "System maintenance scheduled for Feb 15, 10pm–2am EST.", date: "Feb 7, 2025", active: false },
                    { text: "Welcome to the Spring 2025 semester! Registration is now open.", date: "Jan 5, 2025", active: false },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm">{a.text}</p>
                        <p className="text-xs text-muted-foreground">{a.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Expired</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => handleSave("Announcements")}><Save className="h-4 w-4 mr-1.5" /> Publish Announcement</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}