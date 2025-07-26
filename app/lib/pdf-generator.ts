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

  console.log(`Generating ${totalPages} pages for ${magnetInstances.length} magnets`)
  console.log(`Layout: ${rows} rows x ${cols} cols = ${magnetsPerPage} magnets per page`)

  // Create final canvas with all pages
  const finalCanvas = document.createElement("canvas")
  const finalCtx = finalCanvas.getContext("2d")
  if (!finalCtx) throw new Error("Could not create final canvas context")

  finalCanvas.width = pageWidthPx
  finalCanvas.height = pageHeightPx * totalPages

  // Fill final canvas with white
  finalCtx.fillStyle = "#FFFFFF"
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

  // Helper function to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`))
      img.src = src
    })
  }

  // Process all magnets sequentially
  for (let magnetIndex = 0; magnetIndex < magnetInstances.length; magnetIndex++) {
    const { image } = magnetInstances[magnetIndex]

    if (!image.croppedDataUrl) {
      console.warn(`Skipping magnet ${magnetIndex + 1}: no cropped data`)
      continue
    }

    // Calculate which page this magnet belongs to
    const pageIndex = Math.floor(magnetIndex / magnetsPerPage)
    const magnetIndexInPage = magnetIndex % magnetsPerPage

    // Calculate position within the page
    const row = Math.floor(magnetIndexInPage / cols)
    const col = magnetIndexInPage % cols

    const x = marginPx + col * (magnetSizePx + separationPx)
    const pageY = pageIndex * pageHeightPx
    const startY = pageY + marginPx + Math.round(0.551 * dpi) // 14mm from top of page
    const y = startY + row * (magnetSizePx + separationPx)

    try {
      console.log(`Processing magnet ${magnetIndex + 1}/${magnetInstances.length} on page ${pageIndex + 1}`)

      // Load and draw the image
      const img = await loadImage(image.croppedDataUrl)

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
    } catch (error) {
      console.error(`Error processing magnet ${magnetIndex + 1}:`, error)
      // Continue with next magnet instead of failing completely
    }
  }

  // Add headers to all pages after all magnets are drawn
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageY = pageIndex * pageHeightPx

    // Add header for each page
    finalCtx.fillStyle = "#000000"
    finalCtx.font = `bold ${Math.round(0.118 * dpi)}px Arial, sans-serif`
    finalCtx.textAlign = "left"

    const totalMagnetsGenerated = images.reduce((sum, img) => sum + img.quantity, 0)

    let headerText: string
    if (pageIndex === 0) {
      // First page: full header
      headerText = `Pedido: ${orderInfo.orderNumber} | ${orderInfo.customerName} | ${orderInfo.phone} | ${totalMagnetsGenerated} imanes`
    } else {
      // Subsequent pages: simplified header
      headerText = `${orderInfo.customerName} - Pedido: ${orderInfo.orderNumber} (Página ${pageIndex + 1})`
    }

    finalCtx.fillText(headerText, marginPx, pageY + marginPx + Math.round(0.236 * dpi))

    // Add separator line
    finalCtx.strokeStyle = "#C8C8C8"
    finalCtx.lineWidth = Math.round(0.0197 * dpi)
    finalCtx.beginPath()
    finalCtx.moveTo(marginPx, pageY + marginPx + Math.round(0.394 * dpi))
    finalCtx.lineTo(pageWidthPx - marginPx, pageY + marginPx + Math.round(0.394 * dpi))
    finalCtx.stroke()
  }

  console.log("Finished processing all magnets, converting to blob...")

  // Convert to blob and return
  const blob = await new Promise<Blob>((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (blob) {
          console.log(`Generated PNG blob: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
          resolve(blob)
        } else {
          reject(new Error("Failed to create blob from canvas"))
        }
      },
      "image/png",
      1.0,
    )
  })

  return blob
}
