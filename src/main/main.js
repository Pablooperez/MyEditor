const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

async function handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Archivos de texto', extensions: ['txt', 'md', 'js', 'html', 'css', 'json'] }]
    });

    if (!canceled) {
        const rutaArchivo = filePaths[0];
        const contenido = await fs.readFile(rutaArchivo, 'utf-8');
        return { 
            ruta: rutaArchivo, 
            nombre: path.basename(rutaArchivo), 
            contenido: contenido 
        };
    }
    return null;
}

async function handleFileRead(event, filePath) {
    const contenido = await fs.readFile(filePath, 'utf-8');
    return {
        ruta: filePath,
        nombre: path.basename(filePath),
        contenido: contenido
    };
}

async function handleFileSave(event, { filePath, contenido }) {
    let targetPath = filePath;

    if (!targetPath) {
        const { canceled, filePath: selectedPath } = await dialog.showSaveDialog({
            title: 'Guardar archivo de texto',
            defaultPath: 'sin_titulo.txt',
            filters: [{ name: 'Archivos de texto', extensions: ['txt', 'md', 'js', 'html', 'css', 'json'] }]
        });

        if (canceled || !selectedPath) {
            return null;
        }
        targetPath = selectedPath;
    }

    await fs.writeFile(targetPath, contenido, 'utf-8');

    return {
        ruta: targetPath,
        nombre: path.basename(targetPath)
    };
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
    ipcMain.handle('dialog:openFile', handleFileOpen);
    ipcMain.handle('dialog:saveFile', handleFileSave);
    ipcMain.handle('file:read', handleFileRead);
    
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});