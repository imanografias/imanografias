# Imanografías - Generador de Imanes Personalizados

Este proyecto es una aplicación web para generar pedidos de imanes personalizados a partir de imágenes subidas por los usuarios. Permite a los usuarios ingresar información del pedido, subir y recortar imágenes, y luego envía una notificación por correo electrónico con los detalles del pedido y los enlaces a las imágenes generadas.

## Características

-   **Formulario de Pedido**: Recopila el número de pedido, nombre del cliente y cantidad total de imanes.
-   **Subida y Recorte de Imágenes**: Permite a los usuarios subir imágenes y recortarlas a un formato cuadrado con bordes redondeados.
-   **Generación de Archivos**: Procesa las imágenes para generar archivos listos para la producción.
-   **Notificación por Email**: Envía un correo electrónico con los detalles del pedido y los enlaces a las imágenes subidas.
-   **Integración con UploadThing**: Para la gestión de subida y almacenamiento de archivos.
-   **Envío de Emails con Nodemailer (Gmail)**: Utiliza Nodemailer para enviar notificaciones por correo electrónico a través de una cuenta de Gmail usando una contraseña de aplicación.

## Tecnologías Utilizadas

-   Next.js 14 (App Router)
-   React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   UploadThing
-   Nodemailer

## Configuración del Proyecto

Sigue estos pasos para configurar y ejecutar el proyecto localmente:

### 1. Clonar el Repositorio

\`\`\`bash
git clone https://github.com/imanografias/imanografias.git
cd imanografias
\`\`\`

### 2. Instalar Dependencias

Este proyecto utiliza `pnpm`. Asegúrate de tenerlo instalado (`npm install -g pnpm`).

\`\`\`bash
pnpm install
\`\`\`

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz de tu proyecto y añade las siguientes variables de entorno:

\`\`\`env
# UploadThing
UPLOADTHING_SECRET=sk_live_YOUR_UPLOADTHING_SECRET
UPLOADTHING_APP_ID=YOUR_UPLOADTHING_APP_ID

# Gmail para Nodemailer
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
\`\`\`

-   **`UPLOADTHING_SECRET` y `UPLOADTHING_APP_ID`**: Obtén estas claves desde tu panel de control de [UploadThing](https://uploadthing.com/).
-   **`GMAIL_EMAIL`**: Tu dirección de correo electrónico de Gmail que usarás para enviar los correos.
-   **`GMAIL_APP_PASSWORD`**: Una contraseña de aplicación generada específicamente para tu cuenta de Google. **No uses la contraseña principal de tu cuenta de Google.**

#### Cómo Generar una Contraseña de Aplicación de Gmail:

1.  Ve a tu [Cuenta de Google](https://myaccount.google.com/).
2.  En el panel de navegación izquierdo, haz clic en **Seguridad**.
3.  En "Cómo inicias sesión en Google", haz clic en **Contraseñas de aplicaciones**. Es posible que tengas que iniciar sesión.
    -   Si no encuentras "Contraseñas de aplicaciones", asegúrate de que la verificación en dos pasos esté activada para tu cuenta. Si no lo está, actívala primero.
4.  En la parte inferior, en "Seleccionar aplicación" y "Seleccionar dispositivo", elige **"Correo"** y **"Otro (nombre personalizado)"** (puedes poner "Imanografias App" o similar).
5.  Haz clic en **Generar**.
6.  Se generará una contraseña de 16 caracteres en un cuadro amarillo. **Copia esta contraseña** (sin espacios) y pégala como valor de `GMAIL_APP_PASSWORD` en tu archivo `.env.local`. Esta contraseña solo se mostrará una vez.

### 4. Ejecutar la Aplicación

\`\`\`bash
pnpm dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`.

## Estructura del Proyecto

-   `app/page.tsx`: Componente principal de la aplicación con el formulario de pedido, la lógica de subida y el `ImageCropper`.
-   `app/lib/pdf-generator.ts`: Lógica para generar imágenes a partir de los datos de recorte (aunque el nombre sugiere PDF, actualmente genera imágenes).
-   `app/api/uploadthing/core.ts`: Configuración del endpoint de UploadThing para la subida de imágenes.
-   `app/api/uploadthing/route.ts`: Ruta de la API para manejar las subidas de UploadThing.
-   `app/api/send-email/route.ts`: Ruta de la API para enviar correos electrónicos usando Nodemailer.
-   `lib/uploadthing.ts`: Utilidades del cliente para interactuar con UploadThing.
-   `components/ui/*`: Componentes de UI de shadcn/ui.

## Despliegue

Este proyecto está diseñado para ser desplegado en Vercel. Asegúrate de configurar las variables de entorno (`UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`, `GMAIL_EMAIL`, `GMAIL_APP_PASSWORD`) en tu proyecto de Vercel.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un "issue" o envía un "pull request".

## Licencia

[MIT License](LICENSE)
