import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuditEditItem {
  id: string;
  timestamp: string;
  module: 'Dashboard' | 'Membership' | 'Meetings & Events' | 'Attendance & QR' | 'Elections' | 'Ministries' | 'Finance';
  action: string;
  details: string;
  actor: string;
  role: string;
  previousValue?: string;
  newValue?: string;
}

export interface DashboardWritings {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  spiritualTheme: string;
  verseOfTheWeek: string;
  announcementTitle: string;
  announcementText: string;
  announcementActive: boolean;
  motto: string;
  presidentialDirective: string;
}

const DEFAULT_WRITINGS: DashboardWritings = {
  heroEyebrow: 'Technical University of Mombasa Christian Union',
  heroTitle: 'Welcome back',
  heroSubtitle: 'Fellowship oversight, membership registry, ministry activities, meetings, and Sunday service attendance.',
  spiritualTheme: 'Spiritual Year 2026/2027: "Rooted & Grounded in Christ" — Colossians 2:6-7',
  verseOfTheWeek: 'Let all things be done decently and in order. — 1 Corinthians 14:40',
  announcementTitle: 'Important Constitutional Notice',
  announcementText: 'Sunday Revival Service QR attendance system is live. Executive elections and ministry leader vetting portal currently open.',
  announcementActive: true,
  motto: 'Non Sibi Sed Omnibus (Not for ourselves, but for all)',
  presidentialDirective: 'Ensure all fellowship sessions, Sunday services, and committee meetings log digital attendance for constitutional compliance.',
};

const INITIAL_AUDIT_LOGS: AuditEditItem[] = [];

interface DashboardStoreState {
  writings: DashboardWritings;
  auditLogs: AuditEditItem[];
  isEditMode: boolean;
  toggleEditMode: () => void;
  updateWritings: (updates: Partial<DashboardWritings>, actorName?: string) => void;
  resetWritings: (actorName?: string) => void;
  addAuditLog: (log: Omit<AuditEditItem, 'id' | 'timestamp'>) => void;
  clearAuditLogs: () => void;
}

export const useDashboardStore = create<DashboardStoreState>()(
  persist(
    (set, get) => ({
      writings: DEFAULT_WRITINGS,
      auditLogs: INITIAL_AUDIT_LOGS,
      isEditMode: false,

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      updateWritings: (updates, actorName = 'Super Admin') => {
        const prev = get().writings;
        const newWritings = { ...prev, ...updates };

        // Auto-generate audit log for writings change
        const changedKeys = Object.keys(updates) as (keyof DashboardWritings)[];
        const details = `Edited dashboard content (${changedKeys.join(', ')})`;

        const newLog: AuditEditItem = {
          id: `edit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          module: 'Dashboard',
          action: 'Edited Dashboard Writings',
          details,
          actor: actorName,
          role: 'Super Admin',
        };

        set((state) => ({
          writings: newWritings,
          auditLogs: [newLog, ...state.auditLogs.slice(0, 49)],
        }));
      },

      resetWritings: (actorName = 'Super Admin') => {
        const newLog: AuditEditItem = {
          id: `edit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          module: 'Dashboard',
          action: 'Reset Dashboard Content to Defaults',
          details: 'Restored all original headings, theme, and announcements',
          actor: actorName,
          role: 'Super Admin',
        };
        set((state) => ({
          writings: DEFAULT_WRITINGS,
          auditLogs: [newLog, ...state.auditLogs.slice(0, 49)],
        }));
      },

      addAuditLog: (logData) => {
        const newLog: AuditEditItem = {
          ...logData,
          id: `edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs.slice(0, 99)],
        }));
      },

      clearAuditLogs: () => set({ auditLogs: [] }),
    }),
    {
      name: 'tumcu-dashboard-store-v3',
    }
  )
);
