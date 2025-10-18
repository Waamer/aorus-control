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

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};