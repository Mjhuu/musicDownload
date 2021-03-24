const {ipcMain, BrowserWindow} = require('electron');
// 获取当前窗口对象
const mainWindow = BrowserWindow.getFocusedWindow();
let window = null

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

// 新窗口打开完毕
ipcMain.on('newWindowOpened', function (e, data) {
    console.log('---');
    console.log({tip: '新窗口打开完毕'});
    e.sender.send('fromMainNewWindowOpened', '新窗口打开完毕')
});

ipcMain.on('openNewWindow', function (e, data) {
    // 获取当前的窗口对象
    const winId = BrowserWindow.getFocusedWindow().id;
    console.log({winId});
    // 需要处理的文件对象
    console.log({data});

    function createWindow () {
        const winURL = process.env.NODE_ENV === 'development'
            ? `http://localhost:9080/index.html#/newWindow`
            : `file://${__dirname}/index.html#/newWindow`

        window = new BrowserWindow({
            width: 300,
            height: 400,
            title: '新窗口',
            webPreferences: {
                backgroundThrottling: false,
                nodeIntegration: true // Electron升级到5.0以上之后，在创建窗口的时候需要手动开启node集成
            }
        })
        window.loadURL(winURL)

        // 监听当前窗口加载完成的事件
        window.webContents.on('did-finish-load',(event) => {
            console.log({data: '当前窗口加载完成'});
            window.webContents.send('fromRenderData', data, winId)
        })
        window.on('closed', function () {
            window = null
        })
    }

    function showWindow () {
        if (window === null) {
            createWindow()
        }

        // window.show()
        // window.focus()
    }

    showWindow()
});
