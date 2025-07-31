import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { orderNumber, customerName, fileCount, files } = await request.json()

    // Validar variables de entorno
    const gmailEmail = process.env.GMAIL_EMAIL
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

    if (!gmailEmail || !gmailAppPassword) {
      console.error("Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD environment variables.")
      return NextResponse.json({ message: "Server configuration error: Email credentials missing." }, { status: 500 })
    }

    // Configurar el transportador de Nodemailer para Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailAppPassword,
      },
    })

    // Construir la tabla de archivos para el email
    const filesTableRows = files
      .map(
        (file: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${file.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${(file.size / 1024 / 1024).toFixed(2)} MB</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><a href="${file.url}" target="_blank">Ver Archivo</a></td>
      </tr>
    `,
      )
      .join("")

    const emailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">Nuevo Pedido de Imanografías</h2>
        <p>Se ha recibido un nuevo pedido de Imanografías con los siguientes detalles:</p>
        
        <h3 style="color: #0056b3;">Información del Pedido:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 5px;"><strong>Número de Pedido:</strong> ${orderNumber}</li>
          <li style="margin-bottom: 5px;"><strong>Nombre del Cliente:</strong> ${customerName}</li>
          <li style="margin-bottom: 5px;"><strong>Cantidad de Archivos Generados:</strong> ${fileCount}</li>
        </ul>

        <h3 style="color: #0056b3;">Detalles de los Archivos:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nombre del Archivo</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tamaño</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">URL</th>
            </tr>
          </thead>
          <tbody>
            ${filesTableRows}
          </tbody>
        </table>

        <p>Por favor, procese este pedido lo antes posible.</p>
        <p>Gracias,</p>
        <p>El equipo de Imanografías</p>
      </div>
    `

    // Opciones del correo electrónico
    const mailOptions = {
      from: gmailEmail,
      to: gmailEmail, // Puedes cambiar esto a un email de destino fijo o configurarlo dinámicamente
      subject: `Nuevo Pedido Imanografías - #${orderNumber} de ${customerName}`,
      html: emailContent,
    }

    // Enviar el correo electrónico
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ message: "Failed to send email", error: (error as Error).message }, { status: 500 })
  }
}
