import { app, BrowserWindow, ipcMain,webContents} from 'electron'
import path from 'node:path'


// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')


let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']


function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      plugins: true,
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: false,
    },
    height: 900,
    width: 1400,
    autoHideMenuBar: true,
    // frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: true,
  });
  // win.webContents.openDevTools()
  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // win.webContents.on('new-window', (event, url, frameName, disposition, options) => {
  //   // Prevent Electron's default handling
  //   event.preventDefault();

  //   // Create the new window with native navigation controls
  //   Object.assign(options, {
  //     webPreferences: {
  //       preload: path.join(__dirname, 'preload.js'),
  //       nodeIntegration: false,
  //       contextIsolation: true,
  //       nativeWindowOpen: true,
  //     },
  //   });

  //   // Open the new window
  //   const newWindow = new BrowserWindow(options);
  //   newWindow.loadURL(url);
  // });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}

// app.on("web-contents-created", (webContentsCreatedEvent, contents)=>{
//   contents.on("will-navigate", function(e, reqUrl) {
//       console.log(`Popup is navigating to: ${reqUrl}`);
//   });
// });

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
