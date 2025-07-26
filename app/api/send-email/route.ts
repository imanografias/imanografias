import sgMail from "@sendgrid/mail"
import { type NextRequest, NextResponse } from "next/server"

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const orderNumber = formData.get("orderNumber") as string
    const customerName = formData.get("customerName") as string
    const phone = formData.get("phone") as string
    const totalMagnets = formData.get("totalMagnets") as string

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")

    // Create filename
    const fileName = `imanes-${orderNumber}-${customerName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.png`

    // Email configuration
    const msg = {
      to: "frixione.work@gmail.com",
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `ARCHIVO Pedido ${orderNumber}`,
      text: `Pedido: ${orderNumber}\nCliente: ${customerName}\nTeléfono: ${phone}\nTotal imanes: ${totalMagnets}`,
      html: `
        <h3>Nuevo pedido de imanes</h3>
        <p><strong>Pedido:</strong> ${orderNumber}</p>
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <p><strong>Total imanes:</strong> ${totalMagnets}</p>
      `,
      attachments: [
        {
          content: base64Image,
          filename: fileName,
          type: "image/png",
          disposition: "attachment",
        },
      ],
    }

    console.log("Sending email to:", msg.to)
    console.log("Subject:", msg.subject)
    console.log("Attachment filename:", fileName)

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
