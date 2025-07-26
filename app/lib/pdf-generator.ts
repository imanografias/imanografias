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

export async function generatePDFAsImage(images: CroppedImage[], orderInfo: OrderInfo): Promise<Blob> {
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

  // Create main canvas
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
  const headerText = `Pedido: ${orderInfo.orderNumber} | ${orderInfo.customerName} | ${orderInfo.phone} | ${totalMagnetsGenerated} imanes`
  ctx.fillText(headerText, marginPx, marginPx + Math.round(0.236 * dpi)) // 6mm from top

  // Add separator line
  ctx.strokeStyle = "#C8C8C8"
  ctx.lineWidth = Math.round(0.0197 * dpi) // 0.5mm
  ctx.beginPath()
  ctx.moveTo(marginPx, marginPx + Math.round(0.394 * dpi)) // 10mm from top
  ctx.lineTo(pageWidthPx - marginPx, marginPx + Math.round(0.394 * dpi))
  ctx.stroke()

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

  // Create final canvas with all pages
  const finalCanvas = document.createElement("canvas")
  const finalCtx = finalCanvas.getContext("2d")
  if (!finalCtx) throw new Error("Could not create final canvas context")

  finalCanvas.width = pageWidthPx
  finalCanvas.height = pageHeightPx * totalPages

  // Fill final canvas with white
  finalCtx.fillStyle = "#FFFFFF"
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

  let currentPage = 0
  let currentRow = 0
  let currentCol = 0
  const startY = marginPx + Math.round(0.551 * dpi) // 14mm from top

  for (let i = 0; i < magnetInstances.length; i++) {
    const { image } = magnetInstances[i]

    if (!image.croppedDataUrl) continue

    // Check if we need a new page
    if (currentRow >= rows) {
      currentPage++
      currentRow = 0
      currentCol = 0

      // Draw page separator and header for new page
      const pageY = currentPage * pageHeightPx

      // Fill page background
      finalCtx.fillStyle = "#FFFFFF"
      finalCtx.fillRect(0, pageY, pageWidthPx, pageHeightPx)

      // Add header for new page
      finalCtx.fillStyle = "#000000"
      finalCtx.font = `bold ${Math.round(0.118 * dpi)}px Arial, sans-serif`
      finalCtx.textAlign = "left"
      const pageHeaderText = `${orderInfo.customerName} - Pedido: ${orderInfo.orderNumber} (Página ${currentPage + 1})`
      finalCtx.fillText(pageHeaderText, marginPx, pageY + marginPx + Math.round(0.236 * dpi))

      // Add separator line
      finalCtx.strokeStyle = "#C8C8C8"
      finalCtx.lineWidth = Math.round(0.0197 * dpi)
      finalCtx.beginPath()
      finalCtx.moveTo(marginPx, pageY + marginPx + Math.round(0.394 * dpi))
      finalCtx.lineTo(pageWidthPx - marginPx, pageY + marginPx + Math.round(0.394 * dpi))
      finalCtx.stroke()
    }

    // Calculate position
    const x = marginPx + currentCol * (magnetSizePx + separationPx)
    const y = currentPage * pageHeightPx + startY + currentRow * (magnetSizePx + separationPx)

    try {
      // Load and draw the image
      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Draw the magnet image
          finalCtx.drawImage(img, x, y, magnetSizePx, magnetSizePx)

          // Draw dotted border as cutting guide
          finalCtx.strokeStyle = "#969696"
          finalCtx.lineWidth = Math.round(0.0079 * dpi) // 0.2mm
          finalCtx.setLineDash([Math.round(0.059 * dpi), Math.round(0.039 * dpi)]) // 1.5mm, 1mm

          const cornerRadius = Math.round(magnetSizePx * 0.123) // 8mm proportionally

          // Draw rounded rectangle border
          finalCtx.beginPath()
          finalCtx.roundRect(x, y, magnetSizePx, magnetSizePx, cornerRadius)
          finalCtx.stroke()

          // Reset line dash
          finalCtx.setLineDash([])

          resolve(true)
        }
        img.onerror = reject
        img.src = image.croppedDataUrl!
      })
    } catch (error) {
      console.error(`Error adding magnet ${i + 1}:`, error)
    }

    // Move to next position
    currentCol++
    if (currentCol >= cols) {
      currentCol = 0
      currentRow++
    }
  }

  // Convert to blob and return
  const blob = await new Promise<Blob>((resolve) => {
    finalCanvas.toBlob(
      (blob) => {
        resolve(blob!)
      },
      "image/png",
      1.0,
    )
  })

  return blob
}
