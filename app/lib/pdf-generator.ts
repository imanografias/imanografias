interface OrderInfo {
  orderNumber: string
  customerName: string
  phone: string
  totalMagnets: number
}

interface CroppedImage {
  id: string
  file: File
  preview: string
  croppedDataUrl?: string
  quantity: number
  position: { x: number; y: number }
  scale: number
}

export async function generatePDFAsImages(images: CroppedImage[], orderInfo: OrderInfo): Promise<Blob[]> {
  // A4 dimensions in pixels at 300 DPI (8.27 x 11.69 inches)
  const dpi = 300
  const pageWidthPx = Math.round(8.27 * dpi) // 2481px
  const pageHeightPx = Math.round(11.69 * dpi) // 3507px
  const marginPx = Math.round(0.197 * dpi) // 5mm in pixels

  // Magnet size in pixels (6.5cm at 300 DPI)
  const magnetSizePx = Math.round((6.5 / 2.54) * dpi) // ~767px

  // Calculate layout
  const availableWidth = pageWidthPx - 2 * marginPx
  const totalMagnetWidth = 3 * magnetSizePx
  const totalSeparationWidth = availableWidth - totalMagnetWidth
  const separationPx = Math.max(Math.round(0.098 * dpi), totalSeparationWidth / 2) // 2.5mm minimum

  const cols = 3
  const effectiveHeight = pageHeightPx - 2 * marginPx - Math.round(0.591 * dpi) // 15mm for header
  const rows = Math.floor((effectiveHeight + separationPx) / (magnetSizePx + separationPx))

  // Generate all magnet instances
  const magnetInstances: { image: CroppedImage; instanceNumber: number }[] = []
  images.forEach((image) => {
    for (let i = 0; i < image.quantity; i++) {
      magnetInstances.push({ image, instanceNumber: i + 1 })
    }
  })

  // Calculate pages needed
  const magnetsPerPage = rows * cols
  const totalPages = Math.ceil(magnetInstances.length / magnetsPerPage)

  const pageBlobs: Blob[] = []

  // Generate each page separately
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not create canvas context")

    canvas.width = pageWidthPx
    canvas.height = pageHeightPx

    // Fill with white background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, pageWidthPx, pageHeightPx)

    // Add header
    ctx.fillStyle = "#000000"
    ctx.font = `bold ${Math.round(0.118 * dpi)}px Arial, sans-serif` // 10pt at 300 DPI, bold
    ctx.textAlign = "left"

    const totalMagnetsGenerated = images.reduce((sum, img) => sum + img.quantity, 0)
    const headerText =
      totalPages > 1
        ? `Pedido: ${orderInfo.orderNumber} | ${orderInfo.customerName} | ${orderInfo.phone} | ${totalMagnetsGenerated} imanes (Página ${pageIndex + 1}/${totalPages})`
        : `Pedido: ${orderInfo.orderNumber} | ${orderInfo.customerName} | ${orderInfo.phone} | ${totalMagnetsGenerated} imanes`

    ctx.fillText(headerText, marginPx, marginPx + Math.round(0.236 * dpi)) // 6mm from top

    // Add separator line
    ctx.strokeStyle = "#C8C8C8"
    ctx.lineWidth = Math.round(0.0197 * dpi) // 0.5mm
    ctx.beginPath()
    ctx.moveTo(marginPx, marginPx + Math.round(0.394 * dpi)) // 10mm from top
    ctx.lineTo(pageWidthPx - marginPx, marginPx + Math.round(0.394 * dpi))
    ctx.stroke()

    // Calculate magnets for this page
    const startIndex = pageIndex * magnetsPerPage
    const endIndex = Math.min(startIndex + magnetsPerPage, magnetInstances.length)
    const pageMagnets = magnetInstances.slice(startIndex, endIndex)

    const startY = marginPx + Math.round(0.551 * dpi) // 14mm from top

    // Draw magnets for this page
    for (let i = 0; i < pageMagnets.length; i++) {
      const { image } = pageMagnets[i]

      if (!image.croppedDataUrl) continue

      const row = Math.floor(i / cols)
      const col = i % cols

      // Calculate position
      const x = marginPx + col * (magnetSizePx + separationPx)
      const y = startY + row * (magnetSizePx + separationPx)

      try {
        // Load and draw the image
        const img = new Image()
        img.crossOrigin = "anonymous"

        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Draw the magnet image
            ctx.drawImage(img, x, y, magnetSizePx, magnetSizePx)

            // Draw dotted border as cutting guide
            ctx.strokeStyle = "#969696"
            ctx.lineWidth = Math.round(0.0079 * dpi) // 0.2mm
            ctx.setLineDash([Math.round(0.059 * dpi), Math.round(0.039 * dpi)]) // 1.5mm, 1mm

            const cornerRadius = Math.round(magnetSizePx * 0.123) // 8mm proportionally

            // Draw rounded rectangle border
            ctx.beginPath()
            ctx.roundRect(x, y, magnetSizePx, magnetSizePx, cornerRadius)
            ctx.stroke()

            // Reset line dash
            ctx.setLineDash([])

            resolve(true)
          }
          img.onerror = reject
          img.src = image.croppedDataUrl!
        })
      } catch (error) {
        console.error(`Error adding magnet ${i + 1} on page ${pageIndex + 1}:`, error)
      }
    }

    // Convert page to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob!)
        },
        "image/png",
        1.0,
      )
    })

    pageBlobs.push(blob)
  }

  return pageBlobs
}
