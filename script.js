// script.js

/**
 * Terminal Chat - Gemini AI
 * Script principal de la aplicación
 * Versión: 2.0-flash
 * 
 * Funcionalidades:
 * - Conexión automática con API de Google Gemini usando clave preconfigurada
 * - Interfaz de terminal estilo hacker responsiva
 * - Respuestas largas de hasta 4000 tokens
 * - Detección y formateo de código en respuestas
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const terminalBody = document.getElementById('terminal-body');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const statusElement = document.getElementById('status');
    const clearChatButton = document.getElementById('clear-chat');
    
    // API Key ofuscada para mayor seguridad
    const OBFUSCATED_DATA = {
        parts: [
            'MbJvMRJDFhQrSqc1AhFDJRMvJbM'.split('').reverse().join(''),
            'BJ{aTzC__pbzZoWSGjuMFmQrSqc1AhFDJRMvJbM'.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join(''),
            'CK|bUzD__qcz[pXTHkvNGnRrTrd2BiGEKSNwKcN'.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join('')
        ],
        indices: [0, 1, 2],
        offset: 1
    };
    
    let apiKey = deobfuscateApiKey();
    let isProcessing = false; // Flag para controlar el estado de procesamiento
    let currentConversation = []; // Conversación actual
    let selectedModel = 'gemini-2.0-flash'; // Modelo seleccionado por defecto
    let uploadedFiles = []; // Archivos cargados
    
    // Inicializar la aplicación
    initializeApp();
    
    /**
     * Función auxiliar para transformaciones de caracteres
     * @param {string} str - String a transformar
     * @param {number} offset - Offset para la transformación
     * @returns {string} - String transformado
     */
    function transformString(str, offset) {
        return str.split('').map(c => String.fromCharCode(c.charCodeAt(0) + offset)).join('');
    }
    
    /**
     * Función auxiliar para validar formato de API key
     * @param {string} key - Clave a validar
     * @returns {boolean} - True si es válida
     */
    function isValidApiKey(key) {
        return key && key.startsWith('AIza') && key.length > 30;
    }
    
    /**
     * Función para desofuscar la API key
     * @returns {string} - API key desofuscada
     */
    function deobfuscateApiKey() {
        try {
            // Método de desofuscación complejo
            const data = OBFUSCATED_DATA;
            const keyPart = data.parts[data.indices[0]];
            
            // Aplicar transformaciones inversas
            let decoded = keyPart.split('').reverse().join('');
            decoded = transformString(decoded, -data.offset);
            
            // Validar que la clave tenga el formato correcto
            if (isValidApiKey(decoded)) {
                return decoded;
            }
            
            // Fallback: usar la segunda parte
            const fallback = data.parts[data.indices[1]];
            return transformString(fallback, 1);
            
        } catch (error) {
            console.error('Error al desofuscar la API key:', error);
            return null;
        }
    }
    
    /**
     * Función para inicializar la aplicación
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
            addMessage("Sistema conectado correctamente. ¡Ya puedes chatear!", 'ai');
        } else {
            addMessage("Error: No hay API Key configurada.", 'ai');
            statusElement.textContent = "Error";
        }
    }
    
    
    /**
     * Función para configurar todos los event listeners
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
                addMessage(`Modelo cambiado a: ${modelDisplayName}${modelInfo}`, 'ai');
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
    
    /**
     * Función para validar un archivo
     * @param {File} file - Archivo a validar
     * @returns {boolean} - True si el archivo es válido
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
            addMessage(`Error: El archivo ${file.name} es demasiado grande (máximo 20MB)`, 'ai');
            return false;
        }
        
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(py|js|html|css|json|xml|csv|md|txt)$/i)) {
            addMessage(`Error: Tipo de archivo no soportado: ${file.name}`, 'ai');
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
            addMessage(`📎 Archivo: ${file.name} (${fileSize} KB)`, 'ai');
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
            addMessage("Chat limpiado. Puedes comenzar una nueva conversación.", 'ai');
        }
    }
    
    /**
     * Función para enviar mensaje a la API de Gemini
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
            
            // Realizar la petición a la API de Gemini con el modelo seleccionado
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
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
                addMessage("Error: API Key no válida.", 'ai');
            } else if (error.message.includes("quota")) {
                addMessage("Error: Se ha excedido la cuota de la API.", 'ai');
            } else if (error.message.includes("429")) {
                addMessage("Error: Demasiadas solicitudes. Por favor, espera un momento.", 'ai');
            } else {
                addMessage("Error: " + error.message, 'ai');
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
                addMessage(response, 'ai');
            }
        } else {
            // Si la respuesta es larga, dividirla
            addMessage("La respuesta es extensa. Procesando...", 'ai');
            
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
                
                addMessage(`[Parte ${partNumber}] ${chunk}`, 'ai');
                remainingText = remainingText.substring(chunk.length);
                partNumber++;
                
                // Pequeña pausa entre mensajes para mejor UX
                if (remainingText.length > 0) {
                    addMessage("--- Continuando ---", 'ai');
                }
            }
            
            addMessage("Respuesta completa. ¿Necesitas más información?", 'ai');
        }
    }
    
    /**
     * Función para agregar mensaje normal al chat
     * @param {string} text - Texto del mensaje
     * @param {string} sender - Remitente ('user' o 'ai')
     */
    function addMessage(text, sender) {
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
        
        // Agregar botón de copiar solo para mensajes de la IA
        if (sender === 'ai') {
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
});