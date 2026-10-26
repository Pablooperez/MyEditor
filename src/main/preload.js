const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    abrirArchivo: () => ipcRenderer.invoke('dialog:openFile'),
    guardarArchivo: (filePath, contenido) => ipcRenderer.invoke('dialog:saveFile', { filePath, contenido }),
    leerArchivo: (filePath) => ipcRenderer.invoke('file:read', filePath)
});