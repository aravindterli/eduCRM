import { create } from 'zustand';
import { programService } from '@/services/program.service';

interface ProgramState {
  programs: any[];
  loading: boolean;
  error: string | null;
  fetchPrograms: () => Promise<void>;
}

export const useProgramStore = create<ProgramState>((set) => ({
  programs: [],
  loading: false,
  error: null,
  
  fetchPrograms: async () => {
    set({ loading: true });
    try {
      const data = await programService.getAll();
      set({ programs: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  }
}));
