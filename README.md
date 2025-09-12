# 🤖 Gemini Terminal Chat ⚡

![GitHub deployments](https://img.shields.io/github/deployments/luisalgomez111/ChatbotGemini/github-pages?style=for-the-badge&label=Deployment)
![GitHub last commit](https://img.shields.io/github/last-commit/luisalgomez111/ChatbotGemini?style=for-the-badge)
![GitHub license](https://img.shields.io/github/license/luisalgomez111/ChatbotGemini?style=for-the-badge)
![GitHub repo size](https://img.shields.io/github/repo-size/luisalgomez111/ChatbotGemini?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/luisalgomez111/ChatbotGemini?style=for-the-badge)

> Una interfaz de chat minimalista y de código abierto con un estilo de terminal que se conecta a la API de Google Gemini para generar respuestas inteligentes. Perfecta para desarrolladores y entusiastas de la tecnología que prefieren una experiencia de línea de comandos moderna y eficiente.

![Terminal Chat Preview](https://via.placeholder.com/1200x600/0a0e14/00ff00?text=Gemini+Terminal+Chat+Preview)

---

## ✨ Características Principales

- **Interfaz de Usuario Estilo Terminal:** Una experiencia de chat que simula una terminal de hacker, con efectos visuales como una línea de escaneo y una paleta de colores neón.
- **Integración con Google Gemini:** Utiliza el modelo `gemini-2.0-flash` para conversaciones rápidas e inteligentes.
- **Manejo Inteligente de Código:**
  - **Detección Automática:** Identifica bloques de código en las respuestas.
  - **Resaltado de Sintaxis:** Mejora la legibilidad del código.
  - **Funcionalidades Útiles:** Botones para **copiar** el código al portapapeles y **descargar** el archivo directamente.
- **Flujo de Conversación Sencillo:** Mantiene un historial de la conversación durante la sesión para un contexto continuo.
- **Configuración Rápida y Segura:** Incluye una **API Key preconfigurada** para que puedas empezar a usarla de inmediato sin necesidad de credenciales propias.
- **Diseño Responsivo:** Se adapta perfectamente a diferentes tamaños de pantalla, desde ordenadores de escritorio hasta dispositivos móviles.
- **Indicador de Escritura:** Muestra un efecto de "escritura" mientras la IA está generando su respuesta.

---

## 🚀 Demo y Uso

**¡Pruébalo ahora mismo!**
🔗 [**Demo en Vivo**](https://luisalgomez111.github.io/ChatbotGemini/)

Simplemente visita la URL, haz clic en el botón "Conectar" y comienza a chatear.

---

## 📋 Tabla de Contenidos

- [Instalación](#-cómo-instalar-y-ejecutar-en-local)
- [Uso](#-uso)
- [Tecnologías](#-tecnologías-utilizadas)
- [Características](#-características-principales)
- [API Key](#-configuración-de-la-api-key-opcional)
- [Contribuciones](#-contribuciones)
- [Soporte](#-soporte)
- [Licencia](#-licencia)

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript (ES6+)
- **API:**
  - Google Gemini API (`gemini-2.0-flash`)
- **Librerías/Recursos:**
  - Font Awesome (para los iconos de la UI)

---

## 👩‍💻 ¿Cómo Instalar y Ejecutar en Local?

Si quieres clonar el proyecto y ejecutarlo en tu máquina, sigue estos sencillos pasos:

### Prerrequisitos
- Un navegador web moderno (Chrome, Firefox, Safari, Edge).
- Conexión a internet para acceder a la API de Google Gemini.
- Git instalado en tu sistema (para clonar el repositorio)

### Pasos de Instalación
1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/luisalgomez111/ChatbotGemini.git
   ```

2. **Navega al directorio del proyecto:**
   ```bash
   cd ChatbotGemini
   ```

3. **Abre el archivo `index.html`:**
   Simplemente abre el archivo `index.html` en tu navegador. Puedes hacerlo arrastrando el archivo a la ventana del navegador o usando tu explorador de archivos.

### Ejecutar con servidor local (recomendado)

Para una mejor experiencia, puedes usar un servidor local:

```bash
# Con Python 3
python -m http.server 8000

# Con Python 2
python -m SimpleHTTPServer 8000

# Con Node.js (si tienes http-server instalado)
npx http-server

# Con PHP
php -S localhost:8000
```

Luego abre tu navegador y visita `http://localhost:8000`

---

## 🎮 Uso

1. **Conectar:** Haz clic en el botón "Conectar" para inicializar la conexión con la API de Gemini.
2. **Chatear:** Escribe tu mensaje en el campo de entrada y presiona Enter o haz clic en el botón de enviar.
3. **Interactuar con código:** Cuando la respuesta contenga código, utiliza los botones para copiar o descargar.
4. **Mantener conversación:** El chat conserva el contexto durante toda la sesión.

---

## 🔑 Configuración de la API Key (Opcional)

Por defecto, la aplicación utiliza una API Key preconfigurada, lo cual es ideal para pruebas y un uso casual. Sin embargo, si deseas utilizar tu propia clave (por ejemplo, para evitar límites de cuota), puedes hacerlo de la siguiente manera:

1. Obtén tu clave de la [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Abre el archivo `script.js`.
3. Busca la variable `DEFAULT_API_KEY` y reemplaza el valor con tu clave:
   ```javascript
   // Reemplaza 'TU_CLAVE_AQUI' con tu API Key personal de Google Gemini
   const DEFAULT_API_KEY = 'TU_CLAVE_AQUI'; 
   ```

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la interfaz, agregar nuevas funciones o corregir errores, sigue estos pasos:

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Para reportar bugs o solicitar características, por favor usa el [seguidor de issues](https://github.com/luisalgomez111/ChatbotGemini/issues).

---

## 💬 Soporte

Si tienes preguntas o necesitas ayuda con el proyecto:

- Abre un [issue](https://github.com/luisalgomez111/ChatbotGemini/issues) en GitHub
- Contacta por correo electrónico: [luisalbertogomez111@gmail.com](mailto:luisalbertogomez111@gmail.com)

---

## 🙏 ¿Te Gusta el Proyecto?

Si este proyecto te ha sido útil, considera apoyar su desarrollo y mantenimiento continuo.

- **PayPal:** `@LGomez1991`
- **Correo Electrónico:** `luisalbertogomez111@gmail.com`

¡Cualquier contribución es muy apreciada!

---

## 🙌 Agradecimientos

Un agradecimiento especial a **Google Gemini** por potenciar la inteligencia de este proyecto. Su API ha sido fundamental para crear la experiencia de chat fluida e interactiva que ofrece la aplicación.

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 📊 Estadísticas del Proyecto

![GitHub forks](https://img.shields.io/github/forks/luisalgomez111/ChatbotGemini?style=social)
![GitHub stars](https://img.shields.io/github/stars/luisalgomez111/ChatbotGemini?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/luisalgomez111/ChatbotGemini?style=social)

**Desarrollado con ❤️ por [Luis Alberto Gomez](https://github.com/luisalgomez111)**
