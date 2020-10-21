const {ipcMain, BrowserWindow} = require('electron');
// 获取当前窗口对象
const mainWindow = BrowserWindow.getFocusedWindow();

ipcMain.on('window-min', function (e, data) {
    console.log('window-min');
    mainWindow.minimize();
    console.log(data);
});
ipcMain.on('window-max', function (e, data) {
    console.log('window-max');
    if (mainWindow.isMaximized()) {
        mainWindow.restore();
    } else {
        mainWindow.maximize();
    }
    console.log(data);
});
ipcMain.on('window-close', function (e, data) {
    console.log('window-close');
    mainWindow.close();
    console.log(data);
});
ipcMain.on('window-hide', function (e, data) {
    console.log('window-hide');
    mainWindow.hide();
    console.log(data);
});
ipcMain.on('toMain', function (e, data) {
    console.log('---');
    console.log(data);
});
