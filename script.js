document.addEventListener('DOMContentLoaded', function() {
    const terminalBody = document.getElementById('terminal-body');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const statusElement = document.getElementById('status');
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKeyButton = document.getElementById('api-key-button');
    
    let apiKey = '';
    let isProcessing = false;
    let conversationHistory = [];
    
    // Configurar el botón de API Key
    apiKeyButton.addEventListener('click', function() {
        apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            if (apiKey.startsWith('AIza')) {
                statusElement.textContent = "Conectado";
                userInput.disabled = false;
                userInput.focus();
                addMessage("Sistema conectado. ¡Ya puedes chatear!", 'ai');
                apiKeyInput.type = 'password';
            } else {
                addMessage("Error: La API Key debe comenzar con 'AIza'. Verifica tu clave.", 'ai');
            }
        } else {
            addMessage("Error: Por favor ingresa una API Key válida.", 'ai');
        }
    });
    
    // También permitir guardar con Enter en el campo de API Key
    apiKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            apiKeyButton.click();
        }
    });
    
    // Enviar mensaje al hacer clic en el botón
    sendButton.addEventListener('click', sendMessage);
    
    // Enviar mensaje al presionar Enter
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = userInput.value.trim();
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
    
    async function callGeminiApi(message) {
        try {
            // Agregar el mensaje al historial de conversación
            conversationHistory.push({
                role: "user",
                parts: [{ text: message }]
            });
            
            // Preparar el contenido para la API
            const requestBody = {
                contents: conversationHistory,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            };
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Error en la API: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extraer el texto de la respuesta
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Agregar la respuesta al historial de conversación
            conversationHistory.push({
                role: "model",
                parts: [{ text: aiResponse }]
            });
            
            // Ocultar indicador y mostrar respuesta
            typingIndicator.style.display = 'none';
            
            // Detectar si la respuesta contiene código
            if (containsCode(aiResponse)) {
                addCodeMessage(aiResponse, 'ai');
            } else {
                addMessage(aiResponse, 'ai');
            }
            
            isProcessing = false;
            userInput.disabled = false;
            userInput.focus();
            statusElement.textContent = "Conectado";
            
        } catch (error) {
            console.error('Error:', error);
            typingIndicator.style.display = 'none';
            
            // Mensaje de error
            if (error.message.includes("API key not valid")) {
                addMessage("Error: API Key no válida. Por favor, verifica tu clave.", 'ai');
            } else if (error.message.includes("quota")) {
                addMessage("Error: Se ha excedido la cuota de la API.", 'ai');
            } else {
                addMessage("Error: " + error.message, 'ai');
            }
            
            isProcessing = false;
            userInput.disabled = false;
            userInput.focus();
            statusElement.textContent = "Error de conexión";
        }
    }
    
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        
        const textElement = document.createElement('span');
        textElement.textContent = text;
        
        messageElement.appendChild(textElement);
        terminalBody.appendChild(messageElement);
        scrollToBottom();
    }
    
    function addCodeMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        
        // Crear contenedor de código
        const codeBlock = document.createElement('div');
        codeBlock.classList.add('code-block');
        
        // Crear encabezado del código
        const codeHeader = document.createElement('div');
        codeHeader.classList.add('code-header');
        
        const codeLanguage = document.createElement('span');
        codeLanguage.classList.add('code-language');
        codeLanguage.textContent = detectProgrammingLanguage(text);
        
        const codeActions = document.createElement('div');
        codeActions.classList.add('code-actions');
        
        const copyButton = document.createElement('button');
        copyButton.classList.add('code-btn');
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copiar';
        copyButton.addEventListener('click', function() {
            copyToClipboard(extractCode(text));
        });
        
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
    
    function containsCode(text) {
        // Detectar si el texto contiene código de programación
        const codePatterns = [
            /\b(function|def|class|import|from|var|let|const|if|else|for|while|return)\b/,
            /[{}()<>;=]/,
            /```[\s\S]*?```/,
            /<\?php|<\/script>|<\/style>/
        ];
        
        return codePatterns.some(pattern => pattern.test(text));
    }
    
    function extractCode(text) {
        // Extraer solo el código del texto
        const codeBlockMatch = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            return codeBlockMatch[1].trim();
        }
        
        // Si no hay bloques de código marcados, devolver el texto completo
        return text;
    }
    
    function detectProgrammingLanguage(text) {
        // Detectar el lenguaje de programación
        if (text.includes('<?php') || text.includes('$')) return 'PHP';
        if (text.includes('import React') || text.includes('function Component')) return 'JavaScript (React)';
        if (text.includes('from flask') || text.includes('def ')) return 'Python';
        if (text.includes('function') && text.includes('{')) return 'JavaScript';
        if (text.includes('class') && text.includes('{')) return 'Java/C#/C++';
        if (text.includes('<html') || text.includes('<div')) return 'HTML';
        if (text.includes('color:') || text.includes('margin:')) return 'CSS';
        if (text.includes('SELECT') || text.includes('FROM')) return 'SQL';
        
        return 'Código';
    }
    
    function detectFileExtension(text) {
        // Detectar la extensión de archivo adecuada
        const lang = detectProgrammingLanguage(text);
        
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
    
    function copyToClipboard(text) {
        // Copiar texto al portapapeles
        navigator.clipboard.writeText(text).then(() => {
            // Mostrar mensaje de confirmación
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
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 2000);
        });
    }
    
    function downloadCode(code, extension) {
        // Descargar el código como archivo
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codigo.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function scrollToBottom() {
        // Desplazar automáticamente hacia abajo
        setTimeout(() => {
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 100);
    }
});