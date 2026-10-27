// ==========================================
// 1. GESTIÓN DE VISTAS Y DOCUMENTOS NUEVOS
// ==========================================
let rutaArchivoActual = null;
let archivosRecientes = [];

function setView(viewId) {
    document.getElementById('view-p1').classList.add('hidden');
    document.getElementById('view-p2').classList.add('hidden');
    document.getElementById('view-p3').classList.add('hidden');
    document.getElementById('view-' + viewId).classList.remove('hidden');
}

function nuevoDocumento() {
    rutaArchivoActual = null; // Al ser nuevo, no tiene ruta asignada aún
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.value = '';
    }
    
    document.getElementById('editor-tab-name').innerText = 'sin_titulo.txt';
    document.getElementById('editor-status-name').innerText = 'sin_titulo.txt';
    document.getElementById('editor-status-encoding').innerText = 'UTF-8';
    
    setView('p3');
    actualizarLineasYCursor();
}


// ==========================================
// 2. SISTEMA DE ARCHIVOS (Abrir, Guardar y Recientes)
// ==========================================
function actualizarListaRecientes() {
    const contenedorRecientes = document.getElementById('recentFilesList');
    if (!contenedorRecientes) return;

    if (archivosRecientes.length === 0) {
        contenedorRecientes.innerHTML = `<div class="text-xs text-gray-500 italic p-2">No hay archivos recientes</div>`;
        return;
    }

    let htmlRecientes = '';
    archivosRecientes.forEach(archivo => {
        htmlRecientes += `
            <div onclick="cargarArchivoReciente('${archivo.ruta.replace(/\\/g, '\\\\')}')" class="p-3 rounded bg-gray-800/30 hover:bg-gray-800/60 border border-gray-800 flex justify-between items-center text-sm text-gray-300 cursor-pointer transition-all">
                <span class="font-mono truncate max-w-[200px]" title="${archivo.nombre}">${archivo.nombre}</span>
                <span class="text-xs text-gray-500 truncate max-w-[220px]" title="${archivo.ruta}">${archivo.ruta}</span>
            </div>
        `;
    });
    contenedorRecientes.innerHTML = htmlRecientes;
}

async function cargarArchivoReciente(ruta) {
    try {
        const resultado = await window.electronAPI.leerArchivo(ruta);
        if (resultado) {
            rutaArchivoActual = resultado.ruta;
            const textarea = document.querySelector('textarea');
            textarea.value = resultado.contenido;
            
            document.getElementById('editor-tab-name').innerText = resultado.nombre;
            document.getElementById('editor-status-name').innerText = resultado.nombre;
            document.getElementById('editor-status-encoding').innerText = 'UTF-8';

            archivosRecientes = archivosRecientes.filter(item => item.ruta !== resultado.ruta);
            archivosRecientes.unshift({ nombre: resultado.nombre, ruta: resultado.ruta });
            actualizarListaRecientes();

            setView('p3');
            actualizarLineasYCursor();
        }
    } catch (error) {
        console.error("No se pudo cargar el archivo reciente:", error);
    }
}

async function solicitarAperturaArchivo() {
    const resultado = await window.electronAPI.abrirArchivo();
    
    if (resultado) {
        rutaArchivoActual = resultado.ruta;
        const textarea = document.querySelector('textarea');
        textarea.value = resultado.contenido;
        
        document.getElementById('editor-tab-name').innerText = resultado.nombre;
        document.getElementById('editor-status-name').innerText = resultado.nombre;
        document.getElementById('editor-status-encoding').innerText = 'UTF-8';
        
        archivosRecientes = archivosRecientes.filter(item => item.ruta !== resultado.ruta);
        archivosRecientes.unshift({ nombre: resultado.nombre, ruta: resultado.ruta });
        actualizarListaRecientes();

        setView('p3');
        actualizarLineasYCursor();
    }
}

async function solicitarGuardadoArchivo() {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const contenido = textarea.value;
    const resultado = await window.electronAPI.guardarArchivo(rutaArchivoActual, contenido);

    if (resultado) {
        rutaArchivoActual = resultado.ruta;
        
        document.getElementById('editor-tab-name').innerText = resultado.nombre;
        document.getElementById('editor-status-name').innerText = resultado.nombre;
        
        archivosRecientes = archivosRecientes.filter(item => item.ruta !== resultado.ruta);
        archivosRecientes.unshift({ nombre: resultado.nombre, ruta: resultado.ruta });
        actualizarListaRecientes();

        console.log('Archivo guardado en:', resultado.ruta);
    }
}


// ==========================================
// 3. MOTOR DE LÍNEAS Y CURSOR (Editor Core)
// ==========================================
const textarea = document.querySelector('textarea');
const gutter = document.getElementById('lineNumbers');
const statusCursor = document.getElementById('statusCursor');

function actualizarLineasYCursor() {
    if (!textarea || !gutter) return;
    const texto = textarea.value;
    const totalLineas = texto.split('\n').length;
    
    let numerosHTML = '';
    for (let i = 1; i <= totalLineas; i++) {
        numerosHTML += i + '<br>';
    }
    gutter.innerHTML = numerosHTML;

    const cursorPosition = textarea.selectionStart;
    const textoHastaCursor = texto.substring(0, cursorPosition);
    const lineasHastaCursor = textoHastaCursor.split('\n');
    const numeroLinea = lineasHastaCursor.length;
    const numeroColumna = lineasHastaCursor[lineasHastaCursor.length - 1].length + 1;

    if (statusCursor) {
        statusCursor.innerText = `Línea ${numeroLinea}, Columna ${numeroColumna}`;
    }
}

if (textarea && gutter) {
    textarea.addEventListener('scroll', () => {
        gutter.scrollTop = textarea.scrollTop;
    });

    textarea.addEventListener('input', actualizarLineasYCursor);
    textarea.addEventListener('keyup', actualizarLineasYCursor);
    textarea.addEventListener('click', actualizarLineasYCursor);
}

// ==========================================
// 4. PERSONALIZACIÓN DE FUENTE Y TAMAÑO
// ==========================================
const fontFamilySelector = document.getElementById('fontFamilySelector');
const fontSizeSelector = document.getElementById('fontSizeSelector');

function aplicarTipografia() {
    const fuenteSeleccionada = fontFamilySelector ? fontFamilySelector.value : 'JetBrains Mono, monospace';
    const tamanoSeleccionado = fontSizeSelector ? fontSizeSelector.value : '14px';

    // Aplicar al área de texto principal
    if (textarea) {
        textarea.style.fontFamily = fuenteSeleccionada;
        textarea.style.fontSize = tamanoSeleccionado;
    }

    // Aplicar a la columna de números de línea para mantener la sincronización visual
    if (gutter) {
        gutter.style.fontFamily = fuenteSeleccionada;
        gutter.style.fontSize = tamanoSeleccionado;
    }
}

// Escuchar los eventos de cambio en los menús desplegables de configuración
if (fontFamilySelector) {
    fontFamilySelector.addEventListener('change', aplicarTipografia);
}

if (fontSizeSelector) {
    fontSizeSelector.addEventListener('change', aplicarTipografia);
}