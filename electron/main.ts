import { app, BrowserWindow, ipcMain, Menu, Notification, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/kydoicon.ico'),
    title: "Kydo Solutions"
  });

  // Remotely load the content or local file
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server:', process.env.VITE_DEV_SERVER_URL);
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading file:', indexPath);
    win.loadFile(indexPath);
  }

  // Show window when ready
  win.once('ready-to-show', () => {
    console.log('Window ready to show');
    win.show();
  });

  // Handle window load events
  win.webContents.on('did-finish-load', () => {
    console.log('Content loaded successfully');
  });

  win.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
  });

  // Handle window controls or native features here
  ipcMain.on('window-control', (_, action) => {
    switch(action) {
      case 'minimize': win.minimize(); break;
      case 'maximize': win.isMaximized() ? win.unmaximize() : win.maximize(); break;
      case 'close': win.close(); break;
    }
  });

  // Show native notifications requested from renderer
  ipcMain.on('show-notification', (_, payload) => {
    try {
      const notif = new Notification({
        title: payload.title || 'Notification',
        body: payload.body || ''
      });
      notif.show();

      notif.on('click', () => {
        // If payload has a URL, open externally. Otherwise focus window and forward event
        if (payload?.data?.url) {
          shell.openExternal(payload.data.url);
        } else {
          const bw = BrowserWindow.getAllWindows()[0];
          if (bw) {
            bw.focus();
            bw.webContents.send('notification-click', payload.data || {});
          }
        }
      });
    } catch (e) {
      console.warn('Failed to show native notification:', e);
    }
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
