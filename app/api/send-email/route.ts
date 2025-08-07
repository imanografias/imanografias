import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface FileInfo {
  url: string;
  key: string;
  name: string;
  size: number;
}

export async function POST(request: Request) {
  const { orderNumber, customerName, fileCount, files } = await request.json();

  // Validar variables de entorno
  const gmailEmail = process.env.GMAIL_EMAIL;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailEmail || !gmailAppPassword) {
    console.error('GMAIL_EMAIL or GMAIL_APP_PASSWORD environment variables are not set.');
    return NextResponse.json(
      { message: 'Server configuration error: Email credentials missing.' },
      { status: 500 }
    );
  }

  // Configurar el transportador de Nodemailer con Gmail y App Password
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailAppPassword,
    },
  });

  // Construir la tabla de archivos para el email
  const filesTable = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nombre del Archivo</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tamaño</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">URL</th>
        </tr>
      </thead>
      <tbody>
        ${files.map((file: FileInfo) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${file.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${(file.size / 1024 / 1024).toFixed(2)} MB</td>
            <td style="padding: 8px; border: 1px solid #ddd;"><a href="${file.url}" target="_blank" style="color: #1a73e8; text-decoration: none;">Ver Archivo</a></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const mailOptions = {
    from: gmailEmail,
    to: gmailEmail, // Puedes cambiar esto a un email de destino fijo o dinámico
    subject: `Nuevo Pedido de Imanes: #${orderNumber} - ${customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">Detalles del Nuevo Pedido de Imanes</h2>
        <p>Se ha recibido un nuevo pedido a través del generador de Imanografías.</p>
        
        <h3 style="color: #0056b3;">Información del Pedido:</h3>
        <ul>
          <li><strong>Número de Pedido:</strong> ${orderNumber}</li>
          <li><strong>Nombre del Cliente:</strong> ${customerName}</li>
          <li><strong>Cantidad de Archivos Generados:</strong> ${fileCount}</li>
        </ul>

        <h3 style="color: #0056b3;">Archivos Generados:</h3>
        ${filesTable}

        <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
          Este es un email de notificación automática. Por favor, no respondas a este correo.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { message: 'Failed to send email.', error: (error as Error).message },
      { status: 500 }
    );
  }
}
