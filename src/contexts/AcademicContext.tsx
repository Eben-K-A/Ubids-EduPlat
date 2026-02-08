import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Faculty, Department, Program, AcademicPeriod, AcademicLevel, faculties as mockFaculties, academicPeriods as mockPeriods, academicLevels as mockLevels } from "@/types/academic";

interface AcademicContextType {
  faculties: Faculty[];
  periods: AcademicPeriod[];
  levels: AcademicLevel[];
  // Faculty CRUD
  createFaculty: (data: Omit<Faculty, "id" | "departments">) => void;
  updateFaculty: (id: string, data: Partial<Omit<Faculty, "id" | "departments">>) => void;
  deleteFaculty: (id: string) => void;
  // Department CRUD
  createDepartment: (data: Omit<Department, "id" | "programs">) => void;
  updateDepartment: (id: string, data: Partial<Omit<Department, "id" | "programs">>) => void;
  deleteDepartment: (id: string) => void;
  // Program CRUD
  createProgram: (data: Omit<Program, "id">) => void;
  updateProgram: (id: string, data: Partial<Omit<Program, "id">>) => void;
  deleteProgram: (id: string) => void;
  // Helpers
  getAllDepartments: () => (Department & { facultyName: string })[];
  getAllPrograms: () => (Program & { departmentName: string; facultyName: string })[];
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

const STORAGE_KEY = "eduplatform-academic";

export function AcademicProvider({ children }: { children: ReactNode }) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setFaculties(JSON.parse(stored));
    } else {
      setFaculties(mockFaculties);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockFaculties));
    }
  }, []);

  const persist = (data: Faculty[]) => {
    setFaculties(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Faculty
  const createFaculty = (data: Omit<Faculty, "id" | "departments">) => {
    const newFac: Faculty = { ...data, id: `fac-${Date.now()}`, departments: [] };
    persist([...faculties, newFac]);
  };

  const updateFaculty = (id: string, data: Partial<Omit<Faculty, "id" | "departments">>) => {
    persist(faculties.map((f) => (f.id === id ? { ...f, ...data } : f)));
  };

  const deleteFaculty = (id: string) => {
    persist(faculties.filter((f) => f.id !== id));
  };

  // Department
  const createDepartment = (data: Omit<Department, "id" | "programs">) => {
    const newDept: Department = { ...data, id: `dept-${Date.now()}`, programs: [] };
    persist(
      faculties.map((f) =>
        f.id === data.facultyId ? { ...f, departments: [...f.departments, newDept] } : f
      )
    );
  };

  const updateDepartment = (id: string, data: Partial<Omit<Department, "id" | "programs">>) => {
    persist(
      faculties.map((f) => ({
        ...f,
        departments: f.departments.map((d) => (d.id === id ? { ...d, ...data } : d)),
      }))
    );
  };

  const deleteDepartment = (id: string) => {
    persist(
      faculties.map((f) => ({
        ...f,
        departments: f.departments.filter((d) => d.id !== id),
      }))
    );
  };

  // Program
  const createProgram = (data: Omit<Program, "id">) => {
    const newProg: Program = { ...data, id: `prog-${Date.now()}` };
    persist(
      faculties.map((f) => ({
        ...f,
        departments: f.departments.map((d) =>
          d.id === data.departmentId ? { ...d, programs: [...d.programs, newProg] } : d
        ),
      }))
    );
  };

  const updateProgram = (id: string, data: Partial<Omit<Program, "id">>) => {
    persist(
      faculties.map((f) => ({
        ...f,
        departments: f.departments.map((d) => ({
          ...d,
          programs: d.programs.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      }))
    );
  };

  const deleteProgram = (id: string) => {
    persist(
      faculties.map((f) => ({
        ...f,
        departments: f.departments.map((d) => ({
          ...d,
          programs: d.programs.filter((p) => p.id !== id),
        })),
      }))
    );
  };

  const getAllDepartments = () =>
    faculties.flatMap((f) =>
      f.departments.map((d) => ({ ...d, facultyName: f.name }))
    );

  const getAllPrograms = () =>
    faculties.flatMap((f) =>
      f.departments.flatMap((d) =>
        d.programs.map((p) => ({ ...p, departmentName: d.name, facultyName: f.name }))
      )
    );

  return (
    <AcademicContext.Provider
      value={{
        faculties,
        periods: mockPeriods,
        levels: mockLevels,
        createFaculty,
        updateFaculty,
        deleteFaculty,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createProgram,
        updateProgram,
        deleteProgram,
        getAllDepartments,
        getAllPrograms,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic() {
  const context = useContext(AcademicContext);
  if (!context) throw new Error("useAcademic must be used within AcademicProvider");
  return context;
}
