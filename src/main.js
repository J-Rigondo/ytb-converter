const { app, BrowserWindow, ipcMain } = require('electron');
const { downloadVideo } = require('./downloader');
const path = require('path')

function createWindow () {
    const win = new BrowserWindow({
        width: 550,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    win.setTitle(`Mp3 Converter V${app.getVersion()}`);
    win.loadFile('src/index.html');
}

app.on('ready', createWindow);

ipcMain.on('convert', async (event, url) => {
    try {
        const filePath = await downloadVideo(url);
        event.reply('convert-success', filePath);
    } catch (error) {
        event.reply('convert-failure', error.message);
    }
});

ipcMain.on('downloadOpen', (event)=> {
    const downloadsDir = app.getPath('downloads');
    event.reply('downloadOpen', downloadsDir);
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// If development environment
// require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
//     hardResetMethod: 'exit'
// });
