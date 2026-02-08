import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Palette,
  Shield,
  Globe,
  Camera,
  Save,
  Mail,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    bio: "I'm passionate about learning and education.",
    timezone: "America/New_York",
  });

  const [notifications, setNotifications] = useState({
    emailAssignments: true,
    emailGrades: true,
    emailMessages: false,
    pushAssignments: true,
    pushGrades: true,
    pushMessages: true,
  });

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully!");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and public profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-xl">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) =>
                      setProfile({ ...profile, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <Globe className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">
                        Eastern Time (ET)
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time (CT)
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time (MT)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time (PT)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        London (GMT)
                      </SelectItem>
                      <SelectItem value="Europe/Paris">
                        Paris (CET)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Assignment Updates</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified about new assignments and deadlines
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailAssignments}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailAssignments: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Grade Notifications</p>
                        <p className="text-xs text-muted-foreground">
                          Receive emails when grades are posted
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailGrades}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailGrades: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Messages</p>
                        <p className="text-xs text-muted-foreground">
                          Email notifications for new messages
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailMessages}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailMessages: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Push Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Assignment Reminders</p>
                        <p className="text-xs text-muted-foreground">
                          Push notifications for upcoming deadlines
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushAssignments}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, pushAssignments: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Grade Alerts</p>
                        <p className="text-xs text-muted-foreground">
                          Instant notifications for new grades
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushGrades}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, pushGrades: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">New Messages</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified about new messages instantly
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushMessages}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, pushMessages: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the platform looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select your preferred theme
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="h-auto py-4 flex flex-col gap-2"
                        onClick={() => setTheme("light")}
                      >
                        <div className="w-8 h-8 rounded-full bg-background border-2 border-border" />
                        <span className="text-xs">Light</span>
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="h-auto py-4 flex flex-col gap-2"
                        onClick={() => setTheme("dark")}
                      >
                        <div className="w-8 h-8 rounded-full bg-foreground border" />
                        <span className="text-xs">Dark</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                  </div>
                  <Button onClick={() => toast.success("Password updated!")}>
                    Update Password
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
