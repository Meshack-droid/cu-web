import { create } from 'zustand';

export type SimulatedRole =
  | 'super_admin'
  | 'chairperson'
  | 'secretary'
  | 'treasurer'
  | 'ministry_leader'
  | 'member';

interface ViewAsState {
  isSimulating: boolean;
  simulatedRole: SimulatedRole;
  simulatedMinistryCode: string;
  simulatedMinistryName: string;
  academicYear: string;
  semester: string;
  setSimulation: (role: SimulatedRole, ministryCode?: string, ministryName?: string) => void;
  clearSimulation: () => void;
  setAcademicYear: (year: string) => void;
  setSemester: (sem: string) => void;
}

export const useViewAsStore = create<ViewAsState>((set) => ({
  isSimulating: false,
  simulatedRole: 'super_admin',
  simulatedMinistryCode: 'media',
  simulatedMinistryName: 'Media Ministry',
  academicYear: '2026/2027',
  semester: 'Semester 1',
  setSimulation: (role, ministryCode = 'media', ministryName = 'Media Ministry') =>
    set({
      isSimulating: role !== 'super_admin',
      simulatedRole: role,
      simulatedMinistryCode: ministryCode,
      simulatedMinistryName: ministryName,
    }),
  clearSimulation: () =>
    set({
      isSimulating: false,
      simulatedRole: 'super_admin',
    }),
  setAcademicYear: (academicYear) => set({ academicYear }),
  setSemester: (semester) => set({ semester }),
}));
