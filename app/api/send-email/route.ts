import sgMail from "@sendgrid/mail"
import { type NextRequest, NextResponse } from "next/server"

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, customerName, fileCount } = body

    if (!orderNumber) {
      return NextResponse.json({ error: "No order number provided" }, { status: 400 })
    }

    // Simple notification email
    const msg = {
      to: "frixione.work@gmail.com",
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `Pedido #${orderNumber} - Fotos cargadas`,
      text: `El pedido #${orderNumber} de ${customerName} ya cargó sus fotos. Se generaron ${fileCount} archivo(s) PNG.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            📸 Pedido #${orderNumber} - Fotos cargadas
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #495057;">
              El pedido <strong>#${orderNumber}</strong> de <strong>${customerName}</strong> ya cargó sus fotos.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d;">
              Se generaron <strong>${fileCount} archivo(s) PNG</strong> listos para producción.
            </p>
          </div>

          <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              Los archivos están disponibles en UploadThing bajo la carpeta <strong>N${orderNumber}</strong>.
            </p>
          </div>
        </div>
      `,
    }

    console.log("Sending notification email for order:", orderNumber)

    await sgMail.send(msg)

    console.log("Notification email sent successfully")
    return NextResponse.json({ success: true, message: "Notification email sent successfully" })
  } catch (error) {
    console.error("Error sending notification email:", error)

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
