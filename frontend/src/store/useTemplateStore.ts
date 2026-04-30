import { create } from 'zustand';
import API from '../services/api';

interface TemplateState {
  templates: any[];
  loading: boolean;
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: any) => Promise<boolean>;
  updateTemplate: (id: string, data: any) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;

}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,

  fetchTemplates: async () => {
    set({ loading: true });
    try {
      const { data } = await API.get('/templates');
      set({ templates: data });
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      set({ loading: false });
    }
  },

  createTemplate: async (templateData: any) => {
    set({ loading: true });
    try {
      await API.post('/templates', templateData);
      get().fetchTemplates();
      return true;
    } catch (error) {
      console.error('Failed to create template:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateTemplate: async (id: string, templateData: any) => {
    set({ loading: true });
    try {
      await API.put(`/templates/${id}`, templateData);
      get().fetchTemplates();
      return true;
    } catch (error) {
      console.error('Failed to update template:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteTemplate: async (id: string) => {
    set({ loading: true });
    try {
      await API.delete(`/templates/${id}`);
      get().fetchTemplates();
      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
