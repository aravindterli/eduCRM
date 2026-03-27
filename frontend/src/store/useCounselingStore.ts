import { create } from 'zustand';
import { counselingService } from '@/services/counseling.service';

interface CounselingState {
  students: any[];
  schedule: any[];
  loading: boolean;
  error: string | null;
  fetchStudents: () => Promise<void>;
  fetchSchedule: () => Promise<void>;
  logInteraction: (data: any) => Promise<boolean>;
}

export const useCounselingStore = create<CounselingState>((set) => ({
  students: [],
  schedule: [],
  loading: false,
  error: null,
  
  fetchStudents: async () => {
    set({ loading: true });
    try {
      const data = await counselingService.getStudents();
      set({ students: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  fetchSchedule: async () => {
    set({ loading: true });
    try {
      const data = await counselingService.getSchedule();
      set({ schedule: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  logInteraction: async (data: any) => {
    set({ loading: true });
    try {
      await counselingService.logInteraction(data);
      // Refresh data
      const students = await counselingService.getStudents();
      const schedule = await counselingService.getSchedule();
      set({ students, schedule, loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  }
}));
