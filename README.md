# Imanografías - Generador de Imanes Personalizados

Una aplicación web para generar imanes personalizados con fotos de alta calidad.

## Características

- Interfaz intuitiva para subir y editar fotos
- Generación de archivos PNG de alta calidad (300 DPI)
- Soporte para múltiples páginas
- Integración con UploadThing para almacenamiento en la nube
- Notificaciones por email con Gmail (App Password)
- Organización automática por número de pedido

## Configuración

### Variables de entorno requeridas:

\`\`\`env
GMAIL_EMAIL=tu_email_de_gmail@gmail.com
GMAIL_APP_PASSWORD=tu_app_password_de_gmail
UPLOADTHING_SECRET=tu_uploadthing_secret
UPLOADTHING_APP_ID=tu_uploadthing_app_id
\`\`\`

### Configuración de Gmail (App Password):

Para usar Gmail con una App Password, necesitas generar una en tu cuenta de Google. Esto es más seguro que usar tu contraseña principal.

1.  **Activar la verificación en dos pasos (2FA)**: Si no la tienes activada, ve a tu Cuenta de Google > Seguridad > Verificación en dos pasos y actívala. Es un requisito para generar App Passwords.
2.  **Generar una App Password**:
    *   Ve a tu Cuenta de Google.
    *   Haz clic en **Seguridad** en el panel de navegación izquierdo.
    *   En "Cómo inicias sesión en Google", haz clic en **Contraseñas de aplicaciones**. Es posible que tengas que iniciar sesión de nuevo.
    *   En la parte inferior, selecciona **Correo** y luego **Otro (nombre personalizado)**.
    *   Ingresa un nombre (ej. "Imanografias App") y haz clic en **Generar**.
    *   Se te mostrará una contraseña de 16 caracteres. **Copia esta contraseña** (es la única vez que la verás).
3.  **Configurar variables de entorno**:
    *   Usa tu dirección de Gmail completa para `GMAIL_EMAIL`.
    *   Usa la contraseña de 16 caracteres generada como `GMAIL_APP_PASSWORD`.

### Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

## Uso

1. Completa la información del pedido
2. Sube las fotos y ajusta posición/zoom
3. Selecciona la cantidad de copias de cada imagen
4. Envía el pedido

Los archivos se subirán automáticamente a UploadThing organizados en carpetas por número de pedido (Nx) y se enviará una notificación por email con Gmail.

## Solución de problemas

### Error de email:
- Verifica que `GMAIL_EMAIL` y `GMAIL_APP_PASSWORD` sean correctos.
- Asegúrate de que la verificación en dos pasos esté activada en tu cuenta de Google.
- Confirma que la App Password se generó correctamente y se copió sin errores.
- Si el error es "self-signed certificate in certificate chain", puede ser un problema de red o entorno.
