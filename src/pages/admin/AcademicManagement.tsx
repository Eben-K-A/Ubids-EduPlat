import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, Building2, FolderTree, BookOpen } from "lucide-react";
import { FacultyTab } from "@/components/admin/academic/FacultyTab";
import { DepartmentTab } from "@/components/admin/academic/DepartmentTab";
import { ProgramTab } from "@/components/admin/academic/ProgramTab";
import { CourseTab } from "@/components/admin/academic/CourseTab";

export default function AcademicManagement() {
  const [activeTab, setActiveTab] = useState("faculties");

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Academic Structure</h1>
        <p className="text-muted-foreground">
          Manage faculties, departments, programs, and courses
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="faculties" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Faculties</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Programs</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Courses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faculties"><FacultyTab /></TabsContent>
        <TabsContent value="departments"><DepartmentTab /></TabsContent>
        <TabsContent value="programs"><ProgramTab /></TabsContent>
        <TabsContent value="courses"><CourseTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
