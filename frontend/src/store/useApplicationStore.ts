
import { create } from 'zustand';
import { applicationService } from '@/services/application.service';

interface ApplicationState {
  applications: any[];
  loading: boolean;
  fetchApplications: () => Promise<void>;
  updateApplicationStatus: (id: string, status: string, reason?: string) => Promise<boolean>;
  confirmAdmission: (id: string) => Promise<boolean>;
  createApplication: (data: { leadId: string; programId: string }) => Promise<boolean>;
  uploadDocument: (applicationId: string, data: { type: string; url: string }) => Promise<boolean>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  loading: false,

  fetchApplications: async () => {
    set({ loading: true });
    try {
      const data = await applicationService.getApplications();
      set({ applications: data, loading: false });
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      set({ loading: false });
    }
  },

  updateApplicationStatus: async (id: string, status: string, reason?: string) => {
    try {
      await applicationService.updateStatus(id, status, reason);
      // Refresh list
      get().fetchApplications();
      return true;
    } catch (error) {
      console.error('Failed to update status:', error);
      return false;
    }
  },

  confirmAdmission: async (id: string) => {
    try {
      await applicationService.confirmAdmission(id);
      // Refresh list
      get().fetchApplications();
      return true;
    } catch (error) {
      console.error('Failed to confirm admission:', error);
      return false;
    }
  },

  createApplication: async (data: { leadId: string; programId: string }) => {
    try {
      await applicationService.createApplication(data);
      // Refresh list
      get().fetchApplications();
      return true;
    } catch (error) {
      console.error('Failed to create application:', error);
      return false;
    }
  },

  uploadDocument: async (applicationId: string, data: { type: string; url: string }) => {
    set({ loading: true });
    try {
      await applicationService.uploadDocument(applicationId, data);
      get().fetchApplications();
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Failed to upload document:', error);
      set({ loading: false });
      return false;
    }
  }
}));
