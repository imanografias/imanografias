# Imanografías - Generador de Imanes Personalizados

Una aplicación web para generar imanes personalizados con fotos de alta calidad.

## Características

- Interfaz intuitiva para subir y editar fotos
- Generación de archivos PNG de alta calidad (300 DPI)
- Soporte para múltiples páginas
- Integración con UploadThing para almacenamiento en la nube
- Notificaciones por email con SendGrid
- Organización automática por número de pedido

## Configuración

### Variables de entorno requeridas:

\`\`\`env
SENDGRID_API_KEY=tu_sendgrid_api_key
SENDGRID_FROM_EMAIL=tu_email_verificado
UPLOADTHING_SECRET=tu_uploadthing_secret
UPLOADTHING_APP_ID=tu_uploadthing_app_id
\`\`\`

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

Los archivos se subirán automáticamente a UploadThing organizados en carpetas por número de pedido (Nx) y se enviará una notificación por email.
