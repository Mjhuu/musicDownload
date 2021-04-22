const {ipcMain, BrowserWindow} = require('electron');
// 获取当前窗口对象
const mainWindow = BrowserWindow.getFocusedWindow();
// 获取当前的窗口对象
const winId = BrowserWindow.getFocusedWindow().id;
console.log({winId});
// 下载解密进程Map
let decryptWindowMap = new Map();

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
    // 将每一个解密进程进行关闭
    for(let i of decryptWindowMap){
        i[1].close();
    }
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

// 关闭进程
ipcMain.on('decryptWindow-close', function (e, data) {
    console.log('decryptWindow-close');
    decryptWindowMap.get(data.id).close();
    console.log(data);
});

// 新窗口打开完毕
ipcMain.on('newWindowOpened', function (e, data) {
    console.log('---');
    console.log({tip: '新窗口打开完毕'});
    e.sender.send('fromMainNewWindowOpened', '新窗口打开完毕')
});

ipcMain.on('openNewWindow', function (e, data) {

    // 需要处理的文件对象
    console.log({data});

    function createWindow () {
        const winURL = process.env.NODE_ENV === 'development'
            ? `http://localhost:9080/dealDataPage.html`
            : `file://${__dirname}/dealDataPage.html`

        decryptWindowMap.set(data.fileObj.id, new BrowserWindow({
            width: 300,
            height: 400,
            title: `${data.fileObj.id}_解密进程窗口`,
            show: false,
            webPreferences: {
                backgroundThrottling: false,
                nodeIntegration: true // Electron升级到5.0以上之后，在创建窗口的时候需要手动开启node集成
            }
        }));
        let window = decryptWindowMap.get(data.fileObj.id);
        window.loadURL(winURL)

        // 监听当前窗口加载完成的事件
        window.webContents.on('did-finish-load',(event) => {
            console.log({data: '当前窗口加载完成'});
            window.webContents.send('fromRenderData', data, winId)
        })
        for(let i of decryptWindowMap){
            console.log({i});
        }
        window.on('closed', function () {
            decryptWindowMap.set(data.fileObj.id, null);
            decryptWindowMap.delete(data.fileObj.id);
            console.log({data: `${data.fileObj.id}, 解密进程被关闭`});
        })
    }

    function showWindow () {
        let window = decryptWindowMap.get(data.fileObj.id);
        if (!window) {
            createWindow()
        }else {
            window.webContents.send('fromRenderData', data, winId)
        }

        // window.show()
        // window.focus()
    }

    showWindow()
});
