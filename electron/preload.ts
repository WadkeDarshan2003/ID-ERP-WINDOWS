import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendWindowControl: (action: string) => ipcRenderer.send('window-control', action),
  // Show a native OS notification via main process
  showNotification: (title: string, body: string, data?: any) => ipcRenderer.send('show-notification', { title, body, data }),
  // Listen for notification click events forwarded from main
  onNotificationClick: (callback: (data: any) => void) => ipcRenderer.on('notification-click', (_, data) => callback(data)),
});
