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

function aplicarEstilosGlobales() {
    cambiarTipografia();
    cambiarTamanoFuente();
}

function nuevoDocumento() {
    rutaArchivoActual = null;
    const editorArea = document.getElementById('editorContentArea');
    if (editorArea) {
        editorArea.innerHTML = '';
    }
    
    document.getElementById('editor-tab-name').innerText = 'sin_titulo.txt';
    document.getElementById('editor-status-name').innerText = 'sin_titulo.txt';
    document.getElementById('editor-status-encoding').innerText = 'UTF-8';
    
    setView('p3');
    aplicarEstilosGlobales();
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
            const editorArea = document.getElementById('editorContentArea');
            // Usamos innerText para limpiar cualquier código HTML sobrante y mostrar texto puro
            editorArea.innerText = resultado.contenido;
            
            document.getElementById('editor-tab-name').innerText = resultado.nombre;
            document.getElementById('editor-status-name').innerText = resultado.nombre;
            document.getElementById('editor-status-encoding').innerText = 'UTF-8';

            archivosRecientes = archivosRecientes.filter(item => item.ruta !== resultado.ruta);
            archivosRecientes.unshift({ nombre: resultado.nombre, ruta: resultado.ruta });
            actualizarListaRecientes();

            setView('p3');
            aplicarEstilosGlobales();
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
        const editorArea = document.getElementById('editorContentArea');
        // Usamos innerText para asegurar que cargue limpio
        editorArea.innerText = resultado.contenido;
        
        document.getElementById('editor-tab-name').innerText = resultado.nombre;
        document.getElementById('editor-status-name').innerText = resultado.nombre;
        document.getElementById('editor-status-encoding').innerText = 'UTF-8';
        
        archivosRecientes = archivosRecientes.filter(item => item.ruta !== resultado.ruta);
        archivosRecientes.unshift({ nombre: resultado.nombre, ruta: resultado.ruta });
        actualizarListaRecientes();

        setView('p3');
        aplicarEstilosGlobales();
        actualizarLineasYCursor();
    }
}

async function solicitarGuardadoArchivo() {
    const editorArea = document.getElementById('editorContentArea');
    if (!editorArea) return;

    // CLAVE: Guardamos estrictamente el texto plano (innerText) para no ensuciar el archivo con estilos HTML
    const contenido = editorArea.innerText;
    const resultado = await window.electronAPI.guardarArchivo(rutaArchivoActual, contenido);

    if (resultado) {
        rutaArchivoActual = resultado.ruta;
        
        document.getElementById('editor-tab-name').innerText = resultado.nombre;
        document.getElementById('editor-status-name').innerText = resultado.nombre;
        
        archivosRecientes = archivosRecientes.filter(item => item.ruta !== resultado.ruta);
        archivosRecientes.unshift({ nombre: resultado.nombre, ruta: resultado.ruta });
        actualizarListaRecientes();

        console.log('Archivo guardado limpiamente en:', resultado.ruta);
    }
}


// ==========================================
// 3. MOTOR DE FORMATO VISUAL Y MENÚ FLOTANTE
// ==========================================
const editorArea = document.getElementById('editorContentArea');
const bubbleMenu = document.getElementById('bubbleMenu');

function checkTextSelection(event) {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        if (bubbleMenu) {
            bubbleMenu.classList.remove('hidden');
        }
    } else {
        hideBubbleMenu();
    }
    actualizarLineasYCursor();
}

function hideBubbleMenu() {
    if (bubbleMenu) {
        bubbleMenu.classList.add('hidden');
    }
}

function formatText(command) {
    document.execCommand(command, false, null);
    if (editorArea) {
        editorArea.focus();
    }
    actualizarLineasYCursor();
}


// ==========================================
// 4. PERSONALIZACIÓN DE LETRA Y TAMAÑO
// ==========================================
function cambiarTipografia() {
    const selector = document.getElementById('fontFamilySelect');
    const gutter = document.getElementById('lineNumbers');
    
    if (selector && editorArea) {
        const fuente = selector.value;
        editorArea.style.setProperty('font-family', fuente, 'important');
        if (gutter) {
            gutter.style.setProperty('font-family', fuente, 'important');
        }
    }
}

function cambiarTamanoFuente() {
    const selector = document.getElementById('fontSizeSelect');
    const gutter = document.getElementById('lineNumbers');
    
    if (selector && editorArea) {
        const tamano = selector.value;
        editorArea.style.setProperty('font-size', tamano, 'important');
        if (gutter) {
            gutter.style.setProperty('font-size', tamano, 'important');
        }
    }
}


// ==========================================
// 5. MOTOR DE LÍNEAS Y CURSOR
// ==========================================
const gutter = document.getElementById('lineNumbers');
const statusCursor = document.getElementById('statusCursor');

function actualizarLineasYCursor() {
    if (!editorArea || !gutter) return;
    const texto = editorArea.innerText || "";
    const totalLineas = texto.split('\n').length;
    
    let numerosHTML = '';
    for (let i = 1; i <= Math.max(1, totalLineas); i++) {
        numerosHTML += i + '<br>';
    }
    gutter.innerHTML = numerosHTML;

    if (statusCursor) {
        statusCursor.innerText = `Editor Enriquecido`;
    }
}

if (editorArea && gutter) {
    editorArea.addEventListener('scroll', () => {
        gutter.scrollTop = editorArea.scrollTop;
    });

    editorArea.addEventListener('input', actualizarLineasYCursor);
    editorArea.addEventListener('keyup', actualizarLineasYCursor);
}