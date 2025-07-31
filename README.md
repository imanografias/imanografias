# Imanografías - Generador de Imanes Personalizados

Una aplicación web para generar imanes personalizados con fotos de alta calidad.

## Características

- Interfaz intuitiva para subir y editar fotos
- Generación de archivos PNG de alta calidad (300 DPI)
- Soporte para múltiples páginas
- Integración con UploadThing para almacenamiento en la nube
- Notificaciones por email con MailerSend
- Organización automática por número de pedido

## Configuración

### Variables de entorno requeridas:

\`\`\`env
MAILERSEND_API_TOKEN=tu_mailersend_api_token
MAILERSEND_FROM_EMAIL=tu_email_verificado@tudominio.com
UPLOADTHING_SECRET=tu_uploadthing_secret
UPLOADTHING_APP_ID=tu_uploadthing_app_id
\`\`\`

### Configuración de MailerSend:

1. **Crear cuenta en MailerSend**: Ve a [mailersend.com](https://mailersend.com) y crea una cuenta
2. **Verificar dominio**: Agrega y verifica tu dominio en MailerSend
3. **Obtener API Token**: Ve a Settings > API Tokens y crea un nuevo token
4. **Email verificado**: Usa un email de tu dominio verificado como MAILERSEND_FROM_EMAIL

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

Los archivos se subirán automáticamente a UploadThing organizados en carpetas por número de pedido (Nx) y se enviará una notificación por email con MailerSend.

## Solución de problemas

### Error de email:
- Verifica que MAILERSEND_API_TOKEN sea válido
- Asegúrate de que MAILERSEND_FROM_EMAIL esté verificado en tu cuenta
- Revisa que el dominio esté correctamente configurado en MailerSend
