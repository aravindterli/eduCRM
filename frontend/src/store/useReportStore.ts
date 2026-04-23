
import { create } from 'zustand';
import { reportService } from '@/services/report.service';

interface ReportState {
  funnelData: any[];
  programData: any[];
  financeData: any;
  leadStats: any;
  counselorData: any[];
  activityLogs: any[];
  loading: boolean;
  fetchFunnel: () => Promise<void>;
  fetchPrograms: () => Promise<void>;
  fetchFinance: () => Promise<void>;
  fetchLeadStats: () => Promise<void>;
  fetchCounselors: () => Promise<void>;
  fetchActivities: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  funnelData: [],
  programData: [],
  financeData: null,
  leadStats: null,
  counselorData: [],
  activityLogs: [],
  loading: false,

  fetchFunnel: async () => {
    set({ loading: true });
    try {
      const data = await reportService.getFunnel();
      set({ funnelData: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchPrograms: async () => {
    set({ loading: true });
    try {
      const data = await reportService.getPrograms();
      set({ programData: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchFinance: async () => {
    set({ loading: true });
    try {
      const data = await reportService.getFinance();
      set({ financeData: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchLeadStats: async () => {
    set({ loading: true });
    try {
      const data = await reportService.getLeadAnalytics();
      set({ leadStats: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchCounselors: async () => {
    set({ loading: true });
    try {
      const data = await reportService.getassignedTos();
      set({ counselorData: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchActivities: async () => {
    set({ loading: true });
    try {
      const data = await reportService.getActivities();
      set({ activityLogs: data });
    } finally {
      set({ loading: false });
    }
  },
}));
