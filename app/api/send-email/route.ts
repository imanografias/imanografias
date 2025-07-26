import sgMail from "@sendgrid/mail"
import { type NextRequest, NextResponse } from "next/server"

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileUrl, fileName, orderNumber, customerName, phone, totalMagnets } = body

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    // Email configuration with file link instead of attachment
    const msg = {
      to: "frixione.work@gmail.com",
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `ARCHIVO Pedido ${orderNumber}`,
      text: `Pedido: ${orderNumber}\nCliente: ${customerName}\nTeléfono: ${phone}\nTotal imanes: ${totalMagnets}\n\nArchivo: ${fileUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Nuevo pedido de imanes - #${orderNumber}
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Información del pedido:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Pedido:</td>
                <td style="padding: 8px 0;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Cliente:</td>
                <td style="padding: 8px 0;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Teléfono:</td>
                <td style="padding: 8px 0;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Total imanes:</td>
                <td style="padding: 8px 0;">${totalMagnets}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Archivo:</td>
                <td style="padding: 8px 0;">${fileName}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${fileUrl}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;"
               target="_blank">
              📥 Descargar archivo PNG
            </a>
          </div>

          <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              <strong>Nota:</strong> El archivo estará disponible para descarga durante 30 días. 
              Asegúrate de descargarlo y guardarlo en tu sistema.
            </p>
          </div>
        </div>
      `,
    }

    console.log("Sending email to:", msg.to)
    console.log("Subject:", msg.subject)
    console.log("File URL:", fileUrl)

    await sgMail.send(msg)

    console.log("Email sent successfully")
    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Error sending email:", error)

    if (error && typeof error === "object" && "response" in error) {
      const sgError = error as any
      console.error("SendGrid error details:", sgError.response?.body)
      return NextResponse.json({ error: "Failed to send email", details: sgError.response?.body }, { status: 500 })
    }

    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
