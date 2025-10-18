import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  readTemps: () => Promise<number[]>;
  readFans: () => Promise<number[]>;
  readSystemState: () => Promise<{
    fan_mode: string;
    charge_mode: boolean;
    charge_limit: number;
    gpu_boost: boolean;
  }>;
  applySettings: (settings: {
    fan_profile: string;
    custom_speed: number;
    charge_mode: boolean;
    charge_limit: number;
    gpu_boost: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  loadSettings: () => Promise<{
    fan_profile: string;
    custom_speed: number;
    charge_mode: boolean;
    charge_limit: number;
    gpu_boost: boolean;
  }>;
  saveSettings: (settings: any) => Promise<{ success: boolean; error?: string }>;
}

const electronAPI: ElectronAPI = {
  readTemps: () => ipcRenderer.invoke('read-temps'),
  readFans: () => ipcRenderer.invoke('read-fans'),
  readSystemState: () => ipcRenderer.invoke('read-system-state'),
  applySettings: (settings) => ipcRenderer.invoke('apply-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
};

contextBridge.exposeInMainWorld('electron', electronAPI);