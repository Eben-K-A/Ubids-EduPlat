// Academic structure types
export interface Faculty {
  id: string;
  name: string;
  code: string;
  dean: string;
  departments: Department[];
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
  code: string;
  head: string;
  programs: Program[];
}

export interface Program {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  level: "undergraduate" | "postgraduate" | "doctoral";
  duration: number; // in years
  totalCredits: number;
}

export interface AcademicPeriod {
  id: string;
  year: string;
  type: "semester" | "trimester";
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface AcademicLevel {
  id: string;
  name: string;
  value: number; // e.g., 100, 200, 300, 400
}

// Mock academic data
export const faculties: Faculty[] = [
  {
    id: "fac-1",
    name: "Faculty of Computing & Information Technology",
    code: "FCIT",
    dean: "Prof. James Okonkwo",
    departments: [
      {
        id: "dept-1", facultyId: "fac-1", name: "Computer Science", code: "CS", head: "Dr. Sarah Johnson",
        programs: [
          { id: "prog-1", departmentId: "dept-1", name: "BSc Computer Science", code: "BSC-CS", level: "undergraduate", duration: 4, totalCredits: 160 },
          { id: "prog-2", departmentId: "dept-1", name: "MSc Computer Science", code: "MSC-CS", level: "postgraduate", duration: 2, totalCredits: 60 },
        ],
      },
      {
        id: "dept-2", facultyId: "fac-1", name: "Information Technology", code: "IT", head: "Dr. Michael Chen",
        programs: [
          { id: "prog-3", departmentId: "dept-2", name: "BSc Information Technology", code: "BSC-IT", level: "undergraduate", duration: 4, totalCredits: 160 },
        ],
      },
      {
        id: "dept-3", facultyId: "fac-1", name: "Software Engineering", code: "SE", head: "Prof. Lisa Monroe",
        programs: [
          { id: "prog-4", departmentId: "dept-3", name: "BSc Software Engineering", code: "BSC-SE", level: "undergraduate", duration: 4, totalCredits: 160 },
        ],
      },
    ],
  },
  {
    id: "fac-2",
    name: "Faculty of Engineering",
    code: "FoE",
    dean: "Prof. Ahmed Hassan",
    departments: [
      {
        id: "dept-4", facultyId: "fac-2", name: "Electrical Engineering", code: "EE", head: "Dr. Patricia Williams",
        programs: [
          { id: "prog-5", departmentId: "dept-4", name: "BEng Electrical Engineering", code: "BENG-EE", level: "undergraduate", duration: 4, totalCredits: 180 },
        ],
      },
      {
        id: "dept-5", facultyId: "fac-2", name: "Mechanical Engineering", code: "ME", head: "Dr. Robert Taylor",
        programs: [
          { id: "prog-6", departmentId: "dept-5", name: "BEng Mechanical Engineering", code: "BENG-ME", level: "undergraduate", duration: 4, totalCredits: 180 },
        ],
      },
    ],
  },
  {
    id: "fac-3",
    name: "Faculty of Business & Management",
    code: "FBM",
    dean: "Prof. Maria Santos",
    departments: [
      {
        id: "dept-6", facultyId: "fac-3", name: "Business Administration", code: "BA", head: "Dr. Kevin Brown",
        programs: [
          { id: "prog-7", departmentId: "dept-6", name: "BBA Business Administration", code: "BBA", level: "undergraduate", duration: 4, totalCredits: 160 },
          { id: "prog-8", departmentId: "dept-6", name: "MBA Business Administration", code: "MBA", level: "postgraduate", duration: 2, totalCredits: 60 },
        ],
      },
    ],
  },
  {
    id: "fac-4",
    name: "Faculty of Arts & Social Sciences",
    code: "FASS",
    dean: "Prof. Elizabeth Clarke",
    departments: [
      {
        id: "dept-7", facultyId: "fac-4", name: "Mathematics & Statistics", code: "MATH", head: "Dr. Alan Park",
        programs: [
          { id: "prog-9", departmentId: "dept-7", name: "BSc Mathematics", code: "BSC-MATH", level: "undergraduate", duration: 4, totalCredits: 160 },
        ],
      },
    ],
  },
];

export const academicPeriods: AcademicPeriod[] = [
  { id: "ap-1", year: "2025/2026", type: "semester", name: "First Semester", startDate: "2025-09-01", endDate: "2026-01-15", isCurrent: false },
  { id: "ap-2", year: "2025/2026", type: "semester", name: "Second Semester", startDate: "2026-01-20", endDate: "2026-05-30", isCurrent: true },
  { id: "ap-3", year: "2025/2026", type: "trimester", name: "First Trimester", startDate: "2025-09-01", endDate: "2025-12-15", isCurrent: false },
  { id: "ap-4", year: "2025/2026", type: "trimester", name: "Second Trimester", startDate: "2026-01-05", endDate: "2026-04-15", isCurrent: true },
  { id: "ap-5", year: "2025/2026", type: "trimester", name: "Third Trimester", startDate: "2026-04-20", endDate: "2026-07-30", isCurrent: false },
];

export const academicLevels: AcademicLevel[] = [
  { id: "lvl-1", name: "Level 100", value: 100 },
  { id: "lvl-2", name: "Level 200", value: 200 },
  { id: "lvl-3", name: "Level 300", value: 300 },
  { id: "lvl-4", name: "Level 400", value: 400 },
];

// Helper to get all departments flat
export function getAllDepartments() {
  return faculties.flatMap((f) => f.departments);
}

// Helper to get all programs flat
export function getAllPrograms() {
  return faculties.flatMap((f) => f.departments.flatMap((d) => d.programs));
}