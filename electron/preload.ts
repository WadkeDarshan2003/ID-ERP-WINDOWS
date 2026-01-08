import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendWindowControl: (action: string) => ipcRenderer.send('window-control', action),
  // Add other native bridges here (e.g., shell, dialogs)
});
