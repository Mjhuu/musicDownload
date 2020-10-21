import { app, BrowserWindow, Tray, Menu } from 'electron'
let path = require('path');
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}
let tray = null;
let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    backgroundColor: '#2f2f2f',
    frame: false, // 去掉顶部导航
  });

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  });
  // 去掉顶部菜单
  mainWindow.setMenu(null);
  require('./../main/ipcMain.js')
  tray = new Tray(path.join(__static,'favicon.ico'));
  let win = BrowserWindow.getFocusedWindow();

  let template = [
    {
      label: '显示应用',
      click: function () {
        win.show();
      }
    },
    {
      label: '退出',
      click: function () {
        app.quit()
      }
    }
  ];

  const menu = Menu.buildFromTemplate(template);

  tray.setContextMenu(menu);
  tray.setToolTip('航哥专属下载器');
//监听托盘的双击事件

  tray.on('double-click',()=>{
    win.show();
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
});

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    mainWindow.show()
  }
})

if (isSecondInstance) {
  app.quit()
}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
