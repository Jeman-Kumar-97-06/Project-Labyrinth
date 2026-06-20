// frontend/src/store/useTrackerStore.js
import { create } from 'zustand';

export const useTrackerStore = create((set, get) => ({
  eventLog: [],
  startTime: null,
  activeFile: null,
  
  startTracking: () => set({ startTime: Date.now(), eventLog: [] }),
  
  setActiveFile: (file) => {
    set({ activeFile: file });
    get().logEvent('FILE_OPENED', { fileName: file.name, fileId: file.id });
  },

  updateActiveFileContent: (newContent) => {
    set((state) => ({
      activeFile: state.activeFile ? { ...state.activeFile, content: newContent } : null
    }));
  },
  
  logEvent: (eventType, payload = {}) => {
    set((state) => ({
      eventLog: [
        ...state.eventLog,
        {
          timestamp: Date.now(),
          timeSinceStart: state.startTime ? Date.now() - state.startTime : 0,
          type: eventType,
          ...payload,
        },
      ],
    }));
  },
  
  getLedger: () => get().eventLog,
  clearLedger: () => set({ eventLog: [], startTime: null, activeFile: null }),
}));