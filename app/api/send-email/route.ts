import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

interface FileInfo {
  url: string
  key: string
  name: string
  size: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, customerName, fileCount, files } = body

    if (!orderNumber) {
      return NextResponse.json({ error: "No order number provided" }, { status: 400 })
    }

    // Verificar que tenemos las variables de entorno necesarias para Gmail
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Missing Gmail environment variables (GMAIL_EMAIL or GMAIL_APP_PASSWORD)")
      return NextResponse.json({ error: "Email service not configured: Gmail credentials missing" }, { status: 500 })
    }

    // Formatear información de archivos para el email
    const filesInfo = files || []
    const totalSizeMB = filesInfo.reduce((sum: number, file: FileInfo) => sum + file.size / 1024 / 1024, 0)

    // Crear lista de archivos para el HTML
    const fileListHTML = filesInfo
      .map(
        (file: FileInfo, index: number) => `
    <tr style="border-bottom: 1px solid #e9ecef;">
      <td style="padding: 8px; font-size: 14px;">${index + 1}</td>
      <td style="padding: 8px; font-size: 14px; font-family: monospace; background-color: #f8f9fa;">${file.name}</td>
      <td style="padding: 8px; font-size: 12px; font-family: monospace; color: #6c757d; word-break: break-all;">${file.key}</td>
      <td style="padding: 8px; font-size: 14px; text-align: center;">${(file.size / 1024 / 1024).toFixed(2)} MB</td>
      <td style="padding: 8px; text-align: center;">
        <a href="${file.url}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 12px;">
          Ver archivo
        </a>
      </td>
    </tr>
  `,
      )
      .join("")

    // Crear lista de archivos para el texto plano
    const fileListText = filesInfo
      .map(
        (file: FileInfo, index: number) =>
          `${index + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
   Key: ${file.key}
   URL: ${file.url}`,
      )
      .join("\n\n")

    // Configurar el transporter de Nodemailer para Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const mailOptions = {
      from: `Imanografías <${process.env.GMAIL_EMAIL}>`, // Remitente
      to: "frixione.work@gmail.com", // Destinatario
      subject: `Pedido #${orderNumber} - ${fileCount} archivo(s) generado(s)`,
      text: `
Pedido #${orderNumber} - Fotos cargadas

Cliente: ${customerName}
Archivos generados: ${fileCount}
Tamaño total: ${totalSizeMB.toFixed(2)} MB

ARCHIVOS GENERADOS:
${fileListText}

Los archivos están disponibles en UploadThing bajo la carpeta N${orderNumber}.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            📸 Pedido #${orderNumber} - Archivos generados
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #495057;">
              El pedido <strong>#${orderNumber}</strong> de <strong>${customerName}</strong> ya cargó sus fotos.
            </p>
            <div style="margin: 15px 0; display: flex; gap: 20px; flex-wrap: wrap;">
              <div style="background-color: #e3f2fd; padding: 10px; border-radius: 6px; flex: 1; min-width: 120px;">
                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${fileCount}</div>
                <div style="font-size: 12px; color: #666;">Archivos</div>
              </div>
              <div style="background-color: #e8f5e8; padding: 10px; border-radius: 6px; flex: 1; min-width: 120px;">
                <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${totalSizeMB.toFixed(1)} MB</div>
                <div style="font-size: 12px; color: #666;">Tamaño total</div>
              </div>
            </div>
          </div>

          ${
            filesInfo.length > 0
              ? `
          <div style="margin: 30px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">📁 Archivos generados:</h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background-color: #007bff; color: white;">
                    <th style="padding: 12px 8px; text-align: left; font-size: 14px;">#</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 14px;">Nombre</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 14px;">File Key</th>
                    <th style="padding: 12px 8px; text-align: center; font-size: 14px;">Tamaño</th>
                    <th style="padding: 12px 8px; text-align: center; font-size: 14px;">Enlace</th>
                  </tr>
                </thead>
                <tbody>
                  ${fileListHTML}
                </tbody>
              </table>
            </div>
          </div>
          `
              : ""
          }

          <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              📂 Los archivos están organizados en UploadThing bajo la carpeta <strong>N${orderNumber}</strong>
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">
              🔗 Puedes acceder directamente a cada archivo usando los enlaces de la tabla superior
            </p>
          </div>

          <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>💡 Información técnica:</strong><br>
              • Resolución: 300 DPI (alta calidad para impresión)<br>
              • Formato: JPEG optimizado<br>
              • Tamaño de imán: 6.5x6.5 cm con bordes redondeados<br>
              • Layout: 3 columnas por página con guías de corte
            </p>
          </div>
        </div>
      `,
    }

    console.log("Sending email via Gmail for order:", orderNumber)
    console.log("From:", process.env.GMAIL_EMAIL)
    console.log("To: frixione.work@gmail.com")
    console.log(
      "Files info:",
      filesInfo.map((f: FileInfo) => ({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` })),
    )

    await transporter.sendMail(mailOptions)

    console.log("Notification email sent successfully via Gmail")
    return NextResponse.json({ success: true, message: "Notification email sent successfully via Gmail" })
  } catch (error) {
    console.error("Error sending notification email:", error)

    let errorMessage = "Failed to send email"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("Invalid login")) {
        errorMessage = "Invalid Gmail credentials. Please check your GMAIL_EMAIL and GMAIL_APP_PASSWORD."
      } else if (error.message.includes("self-signed certificate")) {
        errorMessage = "SSL certificate issue. Ensure your environment trusts common certificates."
      }
    }

    return NextResponse.json(
      {
        error: "Failed to send email",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
