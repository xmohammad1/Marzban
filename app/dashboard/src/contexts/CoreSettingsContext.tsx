import { fetch } from "service/http";
import { create } from "zustand";

type CoreSettingsStore = {
  isLoading: boolean;
  isPostLoading: boolean;
  fetchCoreSettings: () => void;
  updateConfig: (json: string) => Promise<void>;
  restartCore: () => Promise<void>;
  version: string | null;
  started: boolean | null;
  logs_websocket: string | null;
  config: string;
  templates: any[];
  isTemplatesLoading: boolean;
  fetchTemplates: () => void;
  createTemplate: (payload: { name: string; config: object }) => Promise<any>;
  updateTemplate: (
    id: number,
    payload: { name?: string; config?: object }
  ) => Promise<any>;
  deleteTemplate: (id: number) => Promise<void>;
};

export const useCoreSettings = create<CoreSettingsStore>((set) => ({
  isLoading: true,
  isPostLoading: false,
  version: null,
  started: false,
  logs_websocket: null,
  config: "",
  templates: [],
  isTemplatesLoading: false,
  fetchCoreSettings: () => {
    set({ isLoading: true });
    Promise.all([
      fetch("/core").then(({ version, started, logs_websocket }) =>
        set({ version, started, logs_websocket })
      ),
      fetch("/core/config").then((config) => set({ config })),
    ]).finally(() => set({ isLoading: false }));
  },
  updateConfig: (body) => {
    set({ isPostLoading: true });
    return fetch("/core/config", { method: "PUT", body }).finally(() => {
      set({ isPostLoading: false });
    });
  },
  restartCore: () => {
    return fetch("/core/restart", { method: "POST" });
  },
  fetchTemplates: () => {
    set({ isTemplatesLoading: true });
    return fetch("/xray/templates")
      .then((templates) => set({ templates }))
      .finally(() => set({ isTemplatesLoading: false }));
  },
  createTemplate: (payload) => {
    return fetch("/xray/templates", { method: "POST", body: payload }).then(
      (res) => {
        useCoreSettings.getState().fetchTemplates();
        return res;
      }
    );
  },
  updateTemplate: (id, payload) => {
    return fetch(`/xray/templates/${id}`, { method: "PUT", body: payload }).then(
      (res) => {
        useCoreSettings.getState().fetchTemplates();
        return res;
      }
    );
  },
  deleteTemplate: (id) => {
    return fetch(`/xray/templates/${id}`, { method: "DELETE" }).then((res) => {
      useCoreSettings.getState().fetchTemplates();
      return res;
    });
  },
}));
