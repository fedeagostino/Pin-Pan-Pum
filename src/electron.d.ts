// src/electron.d.ts
export interface IElectronAPI {
  getApiKey: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
