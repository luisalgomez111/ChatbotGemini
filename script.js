/* ===================================================================
   GEMINI TERMINAL
   Script principal de la aplicación de chat con interfaz de terminal
   
   FUNCIONALIDADES PRINCIPALES:
   - Chat con API de Google Gemini usando clave preconfigurada
   - Interfaz de terminal estilo hacker responsiva
   - Respuestas largas de hasta 4000 tokens
   - Detección y formateo de código en respuestas
   - Sistema de rate limiting con reintentos automáticos
   - Carga y procesamiento de archivos múltiples
   - Efectos visuales retro (línea de escaneo CRT)
   - Botón de copiar solo en respuestas de IA
   
   ARQUITECTURA:
   - Variables globales para estado de la aplicación
   - Funciones de inicialización y configuración
   - Manejo de eventos de usuario
   - Comunicación con API de Gemini
   - Procesamiento de archivos
   - Sistema de cola para rate limiting
   - Funciones de utilidad y persistencia
   
   Autor: Luis Alberto Gómez
   Versión: 1.0
   Fecha: 2025
   =================================================================== */

// ==================== INICIALIZACIÓN DE LA APLICACIÓN ====================
// Esperar a que el DOM esté completamente cargado antes de inicializar
document.addEventListener('DOMContentLoaded', function() {
    
    // ==================== VARIABLES GLOBALES ====================
    // Referencias a elementos del DOM para manipulación
    const terminalBody = document.getElementById('terminal-body'); // Contenedor de mensajes
    const userInput = document.getElementById('user-input'); // Campo de entrada de texto
    const sendButton = document.getElementById('send-button'); // Botón de envío
    const typingIndicator = document.getElementById('typing-indicator'); // Indicador de escritura
    const statusElement = document.getElementById('status'); // Elemento de estado
    const clearChatButton = document.getElementById('clear-chat'); // Botón limpiar chat
    
    // ==================== CONFIGURACIÓN DE API ====================
    // API Key directa para Google Gemini (configurada previamente)
    let apiKey = 'AIzaSyC__pbzZoWSGjuMFmQrSqc1AhFDJRMvJbM'; // Clave API de Google Gemini
    
    // ==================== VARIABLES DE ESTADO ====================
    let isProcessing = false; // Flag para controlar el estado de procesamiento de mensajes
    let currentConversation = []; // Array que almacena la conversación actual
    let selectedModel = 'gemini-2.0-flash'; // Modelo de IA seleccionado por defecto
    let uploadedFiles = []; // Array de archivos cargados por el usuario
    let requestQueue = []; // Cola de solicitudes para manejar rate limiting
    let isProcessingRequest = false; // Flag para controlar procesamiento de la cola
    
    // ==================== INICIALIZACIÓN ====================
    // Llamar a la función de inicialización principal
    initializeApp();
    
    // ==================== FUNCIONES DE INICIALIZACIÓN ====================
    
    /**
     * Función principal de inicialización de la aplicación
     * Configura todos los event listeners y establece la conexión inicial
     */
    function initializeApp() {
        // Configurar event listeners
        setupEventListeners();
        
        // Conectar automáticamente con la API
        connectToAPI();
        
        // Ajustar tamaño de la terminal
        adjustTerminalSize();
        
        // Ajustar tamaño cuando cambia la ventana
        window.addEventListener('resize', adjustTerminalSize);
    }
    
    /**
     * Función para ajustar el tamaño de la terminal responsivamente
     */
    function adjustTerminalSize() {
        const terminal = document.querySelector('.terminal');
        const headerHeight = document.querySelector('.terminal-header').offsetHeight;
        const inputHeight = document.querySelector('.input-container').offsetHeight;
        const footerHeight = document.querySelector('.terminal-footer').offsetHeight;
        
        // Calcular altura disponible
        const availableHeight = window.innerHeight - 40; // 20px padding top and bottom
        const terminalBodyHeight = availableHeight - headerHeight - inputHeight - footerHeight;
        
        // Aplicar altura al cuerpo de la terminal
        terminalBody.style.height = `${terminalBodyHeight}px`;
        terminal.style.height = `${availableHeight}px`;
    }
    
    /**
     * Función para conectar con la API de Gemini
     */
    
    function connectToAPI() {
        if (apiKey) {
            statusElement.textContent = "Conectado";
            userInput.disabled = false;
            userInput.focus();
            addSystemMessage("Sistema conectado correctamente. ¡Ya puedes chatear!");
            addSystemMessage("💡 Sistema de rate limiting activado para evitar errores 429. Las solicitudes se procesan automáticamente con reintentos.");
        } else {
            addSystemMessage("Error: No hay API Key configurada.");
            statusElement.textContent = "Error";
        }
    }
    
    
    // ==================== CONFIGURACIÓN DE EVENTOS ====================
    
    /**
     * Configura todos los event listeners de la aplicación
     * Incluye: envío de mensajes, cambio de modelo, carga de archivos, limpieza de chat
     */
    function setupEventListeners() {
        // Enviar mensaje al hacer clic en el botón
        sendButton.addEventListener('click', sendMessage);
        
        // Enviar mensaje al presionar Enter
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Botón para limpiar el chat
        clearChatButton.addEventListener('click', clearChat);
        
        // Selector de modelo
        const modelSelector = document.getElementById('model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', function(e) {
                selectedModel = e.target.value;
                const modelInfo = getModelInfo(selectedModel);
                const modelDisplayName = e.target.options[e.target.selectedIndex].text;
                addSystemMessage(`Modelo cambiado a: ${modelDisplayName}${modelInfo}`);
                updateModelDisplay(modelDisplayName);
            });
        }
        
        // Carga de archivos
        const fileInput = document.getElementById('file-input');
        const fileUploadBtn = document.getElementById('file-upload-btn');
        
        if (fileUploadBtn && fileInput) {
            fileUploadBtn.addEventListener('click', function() {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', function(e) {
                handleFileUpload(e.target.files);
            });
        }
        
        // Aplicar tema hacker por defecto
        document.body.classList.add('hacker-theme');
        
        
    }
    
    /**
     * Función para obtener información sobre el modelo seleccionado
     * @param {string} model - Nombre del modelo
     * @returns {string} - Información del modelo
     */
    function getModelInfo(model) {
        const modelInfo = {
            'gemini-2.0-flash': ' (Más rápido, ideal para conversaciones)',
            'gemini-1.5-flash': ' (Rápido y eficiente, buena calidad)',
            'gemini-1.5-pro': ' (Alta calidad, mejor para tareas complejas)',
            'gemini-1.0-pro': ' (Modelo estable, confiable)'
        };
        return modelInfo[model] || '';
    }
    
    /**
     * Función para actualizar la visualización del modelo en la barra inferior
     * @param {string} modelName - Nombre del modelo a mostrar
     */
    function updateModelDisplay(modelName) {
        const currentModelElement = document.getElementById('current-model');
        if (currentModelElement) {
            currentModelElement.textContent = modelName;
        }
    }
    
    /**
     * Función para manejar la carga de archivos
     * @param {FileList} files - Lista de archivos seleccionados
     */
    function handleFileUpload(files) {
        if (files.length === 0) return;
        
        const validFiles = [];
        Array.from(files).forEach(file => {
            if (validateFile(file)) {
                validFiles.push(file);
            }
        });
        
        if (validFiles.length > 0) {
            showFileModal(validFiles);
        }
    }
    
    // ==================== MANEJO DE ARCHIVOS ====================
    
    /**
     * Valida si un archivo es compatible con la aplicación
     * @param {File} file - Archivo a validar
     * @returns {boolean} - True si el archivo es válido, false en caso contrario
     */
    function validateFile(file) {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const allowedTypes = [
            'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json',
            'application/xml', 'text/csv', 'text/markdown', 'image/jpeg', 'image/png',
            'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/wav',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (file.size > maxSize) {
            addSystemMessage(`Error: El archivo ${file.name} es demasiado grande (máximo 20MB)`);
            return false;
        }
        
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(py|js|html|css|json|xml|csv|md|txt)$/i)) {
            addSystemMessage(`Error: Tipo de archivo no soportado: ${file.name}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Función para procesar un archivo
     * @param {File} file - Archivo a procesar
     */
    function processFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                mimeType: file.type
            };
            
            uploadedFiles.push(fileData);
            displayFileInfo(fileData);
        };
        
        if (file.type.startsWith('text/') || file.name.match(/\.(py|js|html|css|json|xml|csv|md|txt)$/i)) {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    }
    
    /**
     * Función para mostrar el modal de archivos
     * @param {Array} files - Lista de archivos válidos
     */
    function showFileModal(files) {
        const modal = document.getElementById('file-modal');
        const filesList = document.getElementById('files-list');
        const fileComment = document.getElementById('file-comment');
        
        // Limpiar lista anterior
        filesList.innerHTML = '';
        
        // Mostrar archivos en el modal
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.classList.add('file-item');
            fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="fas ${getFileIcon(file.type)}"></i>
                </div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
            `;
            filesList.appendChild(fileItem);
        });
        
        // Limpiar comentario anterior
        fileComment.value = '';
        
        // Mostrar modal
        modal.style.display = 'flex';
        fileComment.focus();
        
        // Configurar event listeners del modal
        setupModalEventListeners(files);
    }
    
    /**
     * Función para obtener el icono apropiado según el tipo de archivo
     * @param {string} fileType - Tipo MIME del archivo
     * @returns {string} - Clase del icono
     */
    function getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fa-image';
        if (fileType.startsWith('video/')) return 'fa-video';
        if (fileType.startsWith('audio/')) return 'fa-music';
        if (fileType.includes('pdf')) return 'fa-file-pdf';
        if (fileType.includes('word')) return 'fa-file-word';
        if (fileType.includes('text/') || fileType.includes('json') || fileType.includes('xml')) return 'fa-file-alt';
        if (fileType.includes('javascript') || fileType.includes('python') || fileType.includes('html') || fileType.includes('css')) return 'fa-code';
        return 'fa-file';
    }
    
    /**
     * Función para configurar los event listeners del modal
     * @param {Array} files - Lista de archivos
     */
    function setupModalEventListeners(files) {
        const modal = document.getElementById('file-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-upload');
        const sendBtn = document.getElementById('send-files');
        const fileComment = document.getElementById('file-comment');
        
        // Función para cerrar modal
        const closeModalFunc = () => {
            modal.style.display = 'none';
        };
        
        // Event listeners
        closeModal.addEventListener('click', closeModalFunc);
        cancelBtn.addEventListener('click', closeModalFunc);
        
        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModalFunc();
            }
        });
        
        // Enviar archivos con comentario
        sendBtn.addEventListener('click', () => {
            const comment = fileComment.value.trim();
            if (comment) {
                sendFilesWithComment(files, comment);
                closeModalFunc();
            } else {
                alert('Por favor, escribe un comentario o instrucciones para los archivos.');
            }
        });
        
        // Enviar con Enter (Ctrl+Enter)
        fileComment.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                sendBtn.click();
            }
        });
    }
    
    /**
     * Función para enviar archivos con comentario
     * @param {Array} files - Lista de archivos
     * @param {string} comment - Comentario del usuario
     */
    function sendFilesWithComment(files, comment) {
        // Procesar archivos
        const processedFiles = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    mimeType: file.type
                };
                processedFiles.push(fileData);
                
                // Cuando todos los archivos estén procesados, enviar
                if (processedFiles.length === files.length) {
                    uploadedFiles = processedFiles;
                    sendMessageWithFiles(comment);
                }
            };
            
            if (file.type.startsWith('text/') || file.name.match(/\.(py|js|html|css|json|xml|csv|md|txt)$/i)) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }
    
    /**
     * Función para enviar mensaje con archivos
     * @param {string} message - Mensaje del usuario
     */
    function sendMessageWithFiles(message) {
        if (isProcessing) return;
        
        isProcessing = true;
        userInput.disabled = true;
        statusElement.textContent = "Procesando...";
        
        // Agregar mensaje del usuario al chat
        addMessage(message, 'user');
        
        // Mostrar información de archivos
        uploadedFiles.forEach(file => {
            const fileSize = (file.size / 1024).toFixed(1);
            addSystemMessage(`📎 Archivo: ${file.name} (${fileSize} KB)`);
        });
        
        // Mostrar indicador de escribiendo
        typingIndicator.style.display = 'block';
        scrollToBottom();
        
        // Llamar a la API de Gemini
        callGeminiApi(message);
    }
    
    /**
     * Función para limpiar el chat actual
     */
    function clearChat() {
        if (confirm("¿Estás seguro de que quieres limpiar la conversación?")) {
            terminalBody.innerHTML = '';
            currentConversation = [];
            uploadedFiles = []; // Limpiar archivos cargados
            addSystemMessage("Chat limpiado. Puedes comenzar una nueva conversación.");
        }
    }
    
    // ==================== COMUNICACIÓN CON API ====================
    
    /**
     * Envía un mensaje del usuario a la API de Gemini
     * Maneja la validación, estado de procesamiento y llamada a la API
     */
    function sendMessage() {
        const message = userInput.value.trim();
        // Validar que haya mensaje, que no se esté procesando y que haya API key
        if (!message || isProcessing || !apiKey) return;
        
        isProcessing = true;
        userInput.disabled = true;
        statusElement.textContent = "Procesando...";
        
        // Agregar mensaje del usuario al chat
        addMessage(message, 'user');
        userInput.value = '';
        
        // Mostrar indicador de escribiendo
        typingIndicator.style.display = 'block';
        scrollToBottom();
        
        // Llamar a la API de Gemini
        callGeminiApi(message);
    }
    
    /**
     * Función para llamar a la API de Gemini
     * @param {string} message - Mensaje del usuario a enviar a la API
     */
    async function callGeminiApi(message) {
        try {
            // Preparar las partes del mensaje (texto + archivos)
            const parts = [{ text: message }];
            
            // Agregar archivos cargados si los hay
            if (uploadedFiles.length > 0) {
                uploadedFiles.forEach(file => {
                    if (file.type.startsWith('image/')) {
                        parts.push({
                            inline_data: {
                                mime_type: file.mimeType,
                                data: file.data.split(',')[1] // Remover el prefijo data:image/...
                            }
                        });
                    } else if (file.type.startsWith('text/') || file.name.match(/\.(py|js|html|css|json|xml|csv|md|txt)$/i)) {
                        parts.push({
                            text: `\n\n--- Contenido del archivo ${file.name} ---\n${file.data}\n--- Fin del archivo ---`
                        });
                    }
                });
            }
            
            // Agregar el mensaje al historial de conversación
            currentConversation.push({
                role: "user",
                parts: parts
            });
            
            // Preparar el contenido para la API con máximo de tokens de salida
            const requestBody = {
                contents: currentConversation,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192, // Máximo permitido por Gemini 2.0 Flash
                    topP: 0.8,
                    topK: 40
                }
            };
            
            // Realizar la petición a la API de Gemini con el modelo seleccionado usando rate limiting
            const response = await queueRequest(
                () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                }),
                'chat-request'
            );
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Error en la API: ${response.status}`);
            }
            
            // Procesar la respuesta
            const data = await response.json();
            
            // Extraer el texto de la respuesta
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Agregar la respuesta al historial de conversación
            currentConversation.push({
                role: "model",
                parts: [{ text: aiResponse }]
            });
            
            // Ocultar indicador y mostrar respuesta
            typingIndicator.style.display = 'none';
            
            // Procesar respuesta larga (dividir si es muy grande)
            processLongResponse(aiResponse);
            
            // Restaurar estado de la interfaz
            isProcessing = false;
            userInput.disabled = false;
            userInput.focus();
            statusElement.textContent = "Conectado";
            
        } catch (error) {
            console.error('Error:', error);
            typingIndicator.style.display = 'none';
            
            // Manejar diferentes tipos de errores
            if (error.message.includes("API key not valid")) {
                addSystemMessage("Error: API Key no válida.");
            } else if (error.message.includes("quota")) {
                addSystemMessage("Error: Se ha excedido la cuota de la API.");
            } else if (error.message.includes("429")) {
                addSystemMessage("Error: Demasiadas solicitudes. Por favor, espera un momento.");
            } else {
                addSystemMessage("Error: " + error.message);
            }
            
            // Restaurar estado de la interfaz después del error
            isProcessing = false;
            userInput.disabled = false;
            userInput.focus();
            statusElement.textContent = "Error de conexión";
        }
    }
    
    /**
     * Función para procesar respuestas largas dividiéndolas si es necesario
     * @param {string} response - Respuesta de la IA
     */
    function processLongResponse(response) {
        // Si la respuesta es muy larga, dividirla en partes
        const maxLength = 50000; // Aumentado significativamente para respuestas muy largas
        const codeBlockRegex = /```[\s\S]*?```/g;
        
        // Buscar bloques de código primero
        const codeBlocks = response.match(codeBlockRegex) || [];
        const textWithoutCode = response.replace(codeBlockRegex, 'CODE_BLOCK_PLACEHOLDER');
        
        if (response.length <= maxLength) {
            // Si la respuesta es corta, procesar normalmente
            if (containsCode(response)) {
                addCodeMessage(response, 'ai');
            } else {
                addMessage(response, 'ai', true); // Mostrar botón de copiar para respuestas reales
            }
        } else {
            // Si la respuesta es larga, dividirla
            addSystemMessage("La respuesta es extensa. Procesando...");
            
            let remainingText = response;
            let partNumber = 1;
            
            while (remainingText.length > 0) {
                let chunk = remainingText.substring(0, maxLength);
                
                // Asegurarse de no cortar en medio de un bloque de código
                const lastCodeBlock = chunk.lastIndexOf('```');
                if (lastCodeBlock > maxLength - 100 && lastCodeBlock !== -1) {
                    // Ajustar el chunk para incluir el bloque de código completo
                    const nextCodeEnd = remainingText.indexOf('```', lastCodeBlock + 3) + 3;
                    if (nextCodeEnd > 0) {
                        chunk = remainingText.substring(0, nextCodeEnd);
                    }
                }
                
                // Asegurarse de no cortar en medio de una oración
                const lastPeriod = chunk.lastIndexOf('. ');
                const lastNewline = chunk.lastIndexOf('\n\n');
                const breakPoint = Math.max(lastPeriod, lastNewline);
                
                if (breakPoint > maxLength - 200 && breakPoint !== -1) {
                    chunk = remainingText.substring(0, breakPoint + 1);
                }
                
                addMessage(`[Parte ${partNumber}] ${chunk}`, 'ai', true); // Mostrar botón de copiar para partes de respuesta
                remainingText = remainingText.substring(chunk.length);
                partNumber++;
                
                // Pequeña pausa entre mensajes para mejor UX
                if (remainingText.length > 0) {
                    addSystemMessage("--- Continuando ---");
                }
            }
            
            addSystemMessage("Respuesta completa. ¿Necesitas más información?");
        }
    }
    
    // ==================== MANEJO DE MENSAJES ====================
    
    /**
     * Agrega un mensaje al chat con formato apropiado
     * @param {string} text - Texto del mensaje
     * @param {string} sender - Remitente ('user' o 'ai')
     * @param {boolean} showCopyButton - Si mostrar botón de copiar (solo para respuestas reales de IA)
     */
    function addMessage(text, sender, showCopyButton = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        
        // Crear contenedor principal del mensaje
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Crear contenedor de texto con mejor formato para mensajes largos
        const textContainer = document.createElement('div');
        textContainer.classList.add('message-text');
        textContainer.textContent = text;
        
        messageContent.appendChild(textContainer);
        
        // Agregar botón de copiar solo para respuestas reales de la IA
        if (sender === 'ai' && showCopyButton) {
            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-message-btn');
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copiar respuesta';
            copyButton.addEventListener('click', function() {
                copyToClipboard(text);
            });
            messageContent.appendChild(copyButton);
        }
        
        messageElement.appendChild(messageContent);
        terminalBody.appendChild(messageElement);
        scrollToBottom();
    }
    
    /**
     * Función para agregar mensaje de sistema (sin botón de copiar)
     * @param {string} text - Texto del mensaje
     */
    function addSystemMessage(text) {
        addMessage(text, 'ai', false);
    }
    
    /**
     * Función para agregar mensaje con código al chat
     * @param {string} text - Texto que contiene código
     * @param {string} sender - Remitente ('user' o 'ai')
     */
    function addCodeMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        
        // Crear contenedor de código
        const codeBlock = document.createElement('div');
        codeBlock.classList.add('code-block');
        
        // Crear encabezado del código con lenguaje y acciones
        const codeHeader = document.createElement('div');
        codeHeader.classList.add('code-header');
        
        const codeLanguage = document.createElement('span');
        codeLanguage.classList.add('code-language');
        codeLanguage.textContent = detectProgrammingLanguage(text);
        
        const codeActions = document.createElement('div');
        codeActions.classList.add('code-actions');
        
        // Botón para copiar código
        const copyButton = document.createElement('button');
        copyButton.classList.add('code-btn');
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copiar';
        copyButton.addEventListener('click', function() {
            copyToClipboard(extractCode(text));
        });
        
        // Botón para descargar código
        const downloadButton = document.createElement('button');
        downloadButton.classList.add('code-btn');
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Descargar';
        downloadButton.addEventListener('click', function() {
            downloadCode(extractCode(text), detectFileExtension(text));
        });
        
        codeActions.appendChild(copyButton);
        codeActions.appendChild(downloadButton);
        
        codeHeader.appendChild(codeLanguage);
        codeHeader.appendChild(codeActions);
        
        // Crear contenido del código
        const codeContent = document.createElement('pre');
        codeContent.classList.add('code-content');
        codeContent.textContent = extractCode(text);
        
        codeBlock.appendChild(codeHeader);
        codeBlock.appendChild(codeContent);
        
        messageElement.appendChild(codeBlock);
        terminalBody.appendChild(messageElement);
        scrollToBottom();
    }
    
    /**
     * Función para detectar si el texto contiene código
     * @param {string} text - Texto a analizar
     * @returns {boolean} - True si contiene código, false en caso contrario
     */
    function containsCode(text) {
        // Patrones comunes en código de programación
        const codePatterns = [
            /\b(function|def|class|import|from|var|let|const|if|else|for|while|return)\b/,
            /[{}()<>;=]/,
            /```[\s\S]*?```/,
            /<\?php|<\/script>|<\/style>/
        ];
        
        return codePatterns.some(pattern => pattern.test(text));
    }
    
    /**
     * Función para extraer código de un texto
     * @param {string} text - Texto que puede contener código
     * @returns {string} - Código extraído
     */
    function extractCode(text) {
        // Intentar extraer código de bloques marcados con ```
        const codeBlockMatch = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            return codeBlockMatch[1].trim();
        }
        
        // Si no hay bloques de código marcados, devolver el texto completo
        return text;
    }
    
    /**
     * Función para detectar el lenguaje de programación de un texto
     * @param {string} text - Texto que contiene código
     * @returns {string} - Nombre del lenguaje detectado
     */
    function detectProgrammingLanguage(text) {
        // Detectar el lenguaje de programación basado en patrones
        if (text.includes('<?php') || text.includes('$')) return 'PHP';
        if (text.includes('import React') || text.includes('function Component')) return 'JavaScript (React)';
        if (text.includes('from flask') || text.includes('def ')) return 'Python';
        if (text.includes('function') && text.includes('{')) return 'JavaScript';
        if (text.includes('class') && text.includes('{')) return 'Java/C#/C++';
        if (text.includes('<html') || text.includes('<div')) return 'HTML';
        if (text.includes('color:') || text.includes('margin:')) return 'CSS';
        if (text.includes('SELECT') || text.includes('FROM')) return 'SQL';
        if (text.includes('```python')) return 'Python';
        if (text.includes('```javascript')) return 'JavaScript';
        if (text.includes('```java')) return 'Java';
        if (text.includes('```html')) return 'HTML';
        if (text.includes('```css')) return 'CSS';
        if (text.includes('```sql')) return 'SQL';
        
        return 'Código';
    }
    
    /**
     * Función para detectar la extensión de archivo apropiada para el código
     * @param {string} text - Texto que contiene código
     * @returns {string} - Extensión de archivo detectada
     */
    function detectFileExtension(text) {
        const lang = detectProgrammingLanguage(text);
        
        // Mapear lenguajes a extensiones de archivo
        switch(lang) {
            case 'PHP': return 'php';
            case 'JavaScript (React)': return 'jsx';
            case 'Python': return 'py';
            case 'JavaScript': return 'js';
            case 'Java/C#/C++': return 'java';
            case 'HTML': return 'html';
            case 'CSS': return 'css';
            case 'SQL': return 'sql';
            default: return 'txt';
        }
    }
    
    /**
     * Función para copiar texto al portapapeles
     * @param {string} text - Texto a copiar
     */
    function copyToClipboard(text) {
        // Usar la API del portapapeles del navegador
        navigator.clipboard.writeText(text).then(() => {
            // Mostrar notificación de confirmación
            const notification = document.createElement('div');
            notification.textContent = '¡Código copiado!';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.background = '#00aa00';
            notification.style.color = '#000';
            notification.style.padding = '10px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1000';
            document.body.appendChild(notification);
            
            // Eliminar la notificación después de 2 segundos
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 2000);
        });
    }
    
    /**
     * Función para descargar código como archivo
     * @param {string} code - Código a descargar
     * @param {string} extension - Extensión del archivo
     */
    function downloadCode(code, extension) {
        // Crear un blob con el código
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Crear un enlace de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `codigo-gemini.${extension}`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Función para desplazar el chat al final
     */
    function scrollToBottom() {
        setTimeout(() => {
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 100);
    }
    
    // ==================== FUNCIONES DE RATE LIMITING ====================
    
    /**
     * Función para hacer solicitudes con manejo de rate limiting
     * @param {Function} requestFunction - Función que hace la solicitud
     * @param {number} retries - Número de reintentos
     * @returns {Promise} - Resultado de la solicitud
     */
    async function makeRequestWithRetry(requestFunction, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await requestFunction();
            } catch (error) {
                console.log(`Intento ${attempt} falló:`, error.message);
                
                if (error.message.includes('429')) {
                    // Rate limit excedido
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Backoff exponencial, máximo 10s
                    console.log(`Rate limit excedido. Esperando ${delay}ms antes del siguiente intento...`);
                    
                    if (attempt < retries) {
                        addSystemMessage(`⏳ Límite de solicitudes excedido. Esperando ${delay/1000}s antes de reintentar...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
                    // Error del servidor
                    const delay = 2000 * attempt;
                    console.log(`Error del servidor. Esperando ${delay}ms...`);
                    
                    if (attempt < retries) {
                        addSystemMessage(`⚠️ Error del servidor. Reintentando en ${delay/1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }
                
                // Si es el último intento o un error no recuperable, lanzar el error
                if (attempt === retries) {
                    throw error;
                }
            }
        }
    }
    
    /**
     * Función para agregar solicitud a la cola
     * @param {Function} requestFunction - Función de solicitud
     * @param {string} type - Tipo de solicitud para logging
     * @returns {Promise} - Resultado de la solicitud
     */
    async function queueRequest(requestFunction, type = 'request') {
        return new Promise((resolve, reject) => {
            requestQueue.push({
                function: requestFunction,
                resolve,
                reject,
                type,
                timestamp: Date.now()
            });
            
            processQueue();
        });
    }
    
    
    /**
     * Función para procesar la cola de solicitudes
     */
    async function processQueue() {
        if (isProcessingRequest || requestQueue.length === 0) {
            return;
        }
        
        isProcessingRequest = true;
        
        while (requestQueue.length > 0) {
            const request = requestQueue.shift();
            
            try {
                // Pequeña pausa entre solicitudes para evitar rate limiting
                if (requestQueue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                const result = await makeRequestWithRetry(request.function);
                request.resolve(result);
            } catch (error) {
                request.reject(error);
            }
        }
        
        isProcessingRequest = false;
    }
    
    
    
    /**
     * Función para mostrar el modal de historial
     */
    function showHistoryModal() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.style.display = 'flex';
            loadHistoryList();
        }
    }
    
    /**
     * Función para cerrar un modal
     * @param {HTMLElement} modal - Elemento del modal a cerrar
     */
    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    
    /**
     * Función para cargar la lista de historial
     */
    function loadHistoryList() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (chatHistory.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #00aa00; font-style: italic;">No hay conversaciones guardadas</p>';
            return;
        }
        
        chatHistory.forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <div class="history-item-name">${chat.name}</div>
                    <div class="history-item-date">${chat.date}</div>
                </div>
                <div class="history-item-preview">${chat.preview}</div>
                <div class="history-item-actions">
                    <button class="history-action-btn" onclick="loadChat(${chat.id})">
                        <i class="fas fa-folder-open"></i> Cargar
                    </button>
                    <button class="history-action-btn" onclick="exportChat(${chat.id})">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                    <button class="history-action-btn" onclick="deleteChat(${chat.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
    }
    
    /**
     * Función para cargar una conversación del historial
     * @param {number} chatId - ID de la conversación
     */
    window.loadChat = function(chatId) {
        const chat = chatHistory.find(c => c.id === chatId);
        if (!chat) return;
        
        // Confirmar si hay conversación actual
        if (currentConversation.length > 0) {
            if (!confirm('¿Estás seguro de que quieres cargar esta conversación? Se perderá la conversación actual.')) {
                return;
            }
        }
        
        // Cargar conversación
        currentConversation = [...chat.conversation];
        selectedModel = chat.model;
        
        // Actualizar UI
        document.getElementById('model-selector').value = selectedModel;
        updateModelDisplay(getModelDisplayName(selectedModel));
        
        // Limpiar y reconstruir chat
        terminalBody.innerHTML = '';
        reconstructChatFromHistory();
        
        // Cerrar modal
        closeModal(document.getElementById('history-modal'));
        
        addSystemMessage(`📂 Conversación cargada: "${chat.name}"`);
    };
    
    /**
     * Función para reconstruir el chat desde el historial
     */
    function reconstructChatFromHistory() {
        currentConversation.forEach((message, index) => {
            if (message.role === 'user' && message.parts && message.parts[0] && message.parts[0].text) {
                addMessage(message.parts[0].text, 'user');
            } else if (message.role === 'model' && message.parts && message.parts[0] && message.parts[0].text) {
                addMessage(message.parts[0].text, 'ai', true); // Mostrar botón de copiar para respuestas del historial
            }
        });
    }
    
    /**
     * Función para exportar una conversación
     * @param {number} chatId - ID de la conversación
     */
    window.exportChat = function(chatId) {
        const chat = chatHistory.find(c => c.id === chatId);
        if (!chat) return;
        
        const exportData = {
            name: chat.name,
            date: chat.date,
            model: chat.model,
            conversation: chat.conversation
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${chat.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    /**
     * Función para eliminar una conversación
     * @param {number} chatId - ID de la conversación
     */
    window.deleteChat = function(chatId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
            return;
        }
        
        chatHistory = chatHistory.filter(c => c.id !== chatId);
        saveHistory();
        loadHistoryList();
    };
    
    
    // ==================== FUNCIONES DE UTILIDAD ====================
    
    /**
     * Convierte el nombre interno del modelo a un nombre amigable para mostrar
     * @param {string} model - Modelo interno (ej: 'gemini-2.0-flash')
     * @returns {string} - Nombre de visualización (ej: 'Gemini 2.0 Flash')
     */
    function getModelDisplayName(model) {
        const modelNames = {
            'gemini-2.0-flash': 'Gemini 2.0 Flash',
            'gemini-1.5-flash': 'Gemini 1.5 Flash',
            'gemini-1.5-pro': 'Gemini 1.5 Pro',
            'gemini-1.0-pro': 'Gemini 1.0 Pro'
        };
        return modelNames[model] || model;
    }
    
    // ==================== FUNCIONES DE PERSISTENCIA ====================
    
    /**
     * Función para cargar configuración guardada
     */
    function loadSavedSettings() {
        // Cargar historial
        const savedHistory = localStorage.getItem('gemini-chat-history');
        if (savedHistory) {
            try {
                chatHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error('Error cargando historial:', e);
                chatHistory = [];
            }
        }
    }
    
    /**
     * Función para guardar historial
     */
    function saveHistory() {
        localStorage.setItem('gemini-chat-history', JSON.stringify(chatHistory));
    }
    
});