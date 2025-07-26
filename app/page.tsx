"use client"

import React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, ArrowLeft, Plus, Minus, Info, AlertTriangle, Mail } from "lucide-react"
import { generatePDFAsImage } from "./lib/pdf-generator"

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

const MagnetCreator = () => {
  const [step, setStep] = useState<"order" | "upload" | "processing">("order")
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    orderNumber: "",
    customerName: "",
    phone: "",
    totalMagnets: 1,
  })
  const [images, setImages] = useState<CroppedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [instructionsAccepted, setInstructionsAccepted] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      orderInfo.orderNumber.trim() &&
      orderInfo.customerName.trim() &&
      orderInfo.phone.trim() &&
      orderInfo.totalMagnets > 0
    ) {
      setStep("upload")
      setShowInstructions(true)
    }
  }

  const handleAcceptInstructions = () => {
    setShowInstructions(false)
    setInstructionsAccepted(true)
  }

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const remainingSlots = orderInfo.totalMagnets - images.length
      const filesToProcess = files.slice(0, remainingSlots)

      filesToProcess.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const newImage: CroppedImage = {
              id: Math.random().toString(36).substr(2, 9),
              file,
              preview: event.target?.result as string,
              quantity: 1,
              position: { x: 0, y: 0 },
              scale: 1,
            }
            setImages((prev) => [...prev, newImage])
          }
          reader.readAsDataURL(file)
        }
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [images.length, orderInfo.totalMagnets],
  )

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const updateImage = (id: string, updates: Partial<CroppedImage>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)))
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    const currentTotal = images.reduce((sum, img) => sum + (img.id === id ? 0 : img.quantity), 0)
    const maxAllowed = orderInfo.totalMagnets - currentTotal
    const finalQuantity = Math.max(0, Math.min(newQuantity, maxAllowed))
    updateImage(id, { quantity: finalQuantity })
  }

  const uploadToUploadThing = async (blob: Blob, fileName: string): Promise<string> => {
    const formData = new FormData()
    formData.append("files", blob, fileName)

    const response = await fetch("/api/uploadthing", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file")
    }

    const result = await response.json()
    return result[0]?.url || result.url
  }

  const handleSendOrder = async () => {
    const totalSelectedMagnets = images.reduce((sum, img) => sum + img.quantity, 0)

    if (totalSelectedMagnets !== orderInfo.totalMagnets) {
      setShowWarning(true)
      return
    }

    setIsGenerating(true)
    try {
      // Generate PNG
      console.log("Generating PNG...")
      const blob = await generatePDFAsImage(images, orderInfo)

      // Create filename
      const fileName = `imanes-${orderInfo.orderNumber}-${orderInfo.customerName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.png`

      // Upload to UploadThing
      console.log("Uploading to UploadThing...")
      const fileUrl = await uploadToUploadThing(blob, fileName)
      console.log("File uploaded successfully:", fileUrl)

      // Send email with file link
      console.log("Sending email...")
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl,
          fileName,
          orderNumber: orderInfo.orderNumber,
          customerName: orderInfo.customerName,
          phone: orderInfo.phone,
          totalMagnets: orderInfo.totalMagnets.toString(),
        }),
      })

      if (response.ok) {
        alert("¡Pedido enviado exitosamente! El archivo se ha subido y el enlace se ha enviado por email.")
        // Reset form
        setStep("order")
        setImages([])
        setOrderInfo({
          orderNumber: "",
          customerName: "",
          phone: "",
          totalMagnets: 1,
        })
      } else {
        const errorData = await response.json()
        console.error("Error sending email:", errorData)
        alert("Error al enviar el email. Por favor, intenta de nuevo.")
      }
    } catch (error) {
      console.error("Error processing order:", error)
      alert("Error al procesar el pedido. Por favor, intenta de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  const totalSelectedMagnets = images.reduce((sum, img) => sum + img.quantity, 0)
  const canGenerate = images.length > 0 && images.every((img) => img.croppedDataUrl) && totalSelectedMagnets > 0

  if (step === "order") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-4 mb-2">
              <img src="/logo-imanografias.png" alt="Imanografías - Fotografías Imantadas" className="w-40 h-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Imanografías</CardTitle>
            <p className="text-gray-600">Completa la información de tu pedido</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <Label htmlFor="orderNumber" className="text-sm font-medium">
                  Número de Pedido *
                </Label>
                <Input
                  id="orderNumber"
                  type="text"
                  value={orderInfo.orderNumber}
                  onChange={(e) => setOrderInfo((prev) => ({ ...prev, orderNumber: e.target.value }))}
                  placeholder="Ej: 159"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Nombre Completo *
                </Label>
                <Input
                  id="customerName"
                  type="text"
                  value={orderInfo.customerName}
                  onChange={(e) => setOrderInfo((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Tu nombre completo"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={orderInfo.phone}
                  onChange={(e) => setOrderInfo((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: +54 9 11 1234-5678"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="totalMagnets" className="text-sm font-medium">
                  Cantidad Total de Imanes *
                </Label>
                <Input
                  id="totalMagnets"
                  type="number"
                  min="1"
                  max="100"
                  value={orderInfo.totalMagnets}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "") {
                      setOrderInfo((prev) => ({ ...prev, totalMagnets: 0 }))
                    } else {
                      const numValue = Number.parseInt(value) || 0
                      setOrderInfo((prev) => ({ ...prev, totalMagnets: Math.max(1, Math.min(100, numValue)) }))
                    }
                  }}
                  required
                  className="mt-1"
                  placeholder="Cantidad de tu compra"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2 justify-center">
                <Info className="w-5 h-5 text-blue-600" />
                Instrucciones - Imanografías
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>
                    • Puedes subir máximo <strong>{orderInfo.totalMagnets} imágenes</strong>
                  </li>
                  <li>• Arrastra para posicionar la imagen dentro del cuadrado</li>
                  <li>• Usa el zoom o gestos táctiles para ajustar el tamaño</li>
                  <li>• Selecciona cuántas copias quieres de cada imagen</li>
                  <li>
                    • La suma total de copias debe ser exactamente <strong>{orderInfo.totalMagnets} imanes</strong>
                  </li>
                  <li>• Cada imán será de 6.5x6.5 cm con bordes redondeados</li>
                </ul>
              </div>
              <Button onClick={handleAcceptInstructions} className="w-full">
                Entendido, continuar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-red-800 flex items-center gap-2 justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Cantidad Incorrecta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-800 text-center">
                  Has seleccionado <strong>{totalSelectedMagnets} imanes</strong> pero tu pedido es de{" "}
                  <strong>{orderInfo.totalMagnets} imanes</strong>.
                </p>
                <p className="text-sm text-red-800 text-center mt-2">
                  Por favor, ajusta las cantidades para que la suma total sea exactamente{" "}
                  <strong>{orderInfo.totalMagnets} imanes</strong>.
                </p>
              </div>
              <Button onClick={() => setShowWarning(false)} className="w-full" variant="outline">
                Entendido, voy a ajustar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStep("order")} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <img src="/logo-imanografias.png" alt="Imanografías" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Imanografías</h1>
                <p className="text-sm text-gray-600">
                  {orderInfo.customerName} - Pedido: {orderInfo.orderNumber}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-sm font-medium ${
                totalSelectedMagnets === orderInfo.totalMagnets
                  ? "text-green-600"
                  : totalSelectedMagnets > orderInfo.totalMagnets
                    ? "text-red-600"
                    : "text-orange-600"
              }`}
            >
              {totalSelectedMagnets}/{orderInfo.totalMagnets} imanes
            </p>
            <p className="text-xs text-gray-500">
              {totalSelectedMagnets === orderInfo.totalMagnets
                ? "Cantidad correcta"
                : totalSelectedMagnets > orderInfo.totalMagnets
                  ? "Excede el pedido"
                  : "Faltan imanes"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sube tus fotos</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {images.length}/{orderInfo.totalMagnets} imágenes
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructions(true)}
                className="flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                Ver instrucciones
              </Button>
            </div>
          </div>

          {images.length < orderInfo.totalMagnets && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Arrastra imágenes aquí o</p>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Seleccionar archivos
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Máximo {orderInfo.totalMagnets} imágenes. Formatos: JPG, PNG, GIF
              </p>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <ImageCropper
                  key={image.id}
                  image={image}
                  maxQuantity={orderInfo.totalMagnets - totalSelectedMagnets + image.quantity}
                  onRemove={() => removeImage(image.id)}
                  onUpdate={(updates) => updateImage(image.id, updates)}
                  onQuantityChange={(quantity) => updateQuantity(image.id, quantity)}
                />
              ))}
            </div>

            {instructionsAccepted && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Recordatorio:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Arrastra para posicionar la imagen dentro del cuadrado</li>
                  <li>• Usa el zoom o gestos táctiles para ajustar el tamaño</li>
                  <li>• Selecciona cuántas copias quieres de cada imagen</li>
                  <li>• La suma total debe ser exactamente {orderInfo.totalMagnets} imanes</li>
                  <li>• Cada imán será de 6.5x6.5 cm con bordes redondeados</li>
                </ul>
              </div>
            )}

            {canGenerate && (
              <div className="mt-8 text-center space-y-4">
                <Button
                  onClick={handleSendOrder}
                  disabled={isGenerating || totalSelectedMagnets !== orderInfo.totalMagnets}
                  size="lg"
                  className="flex items-center gap-2 px-8 py-3"
                >
                  <Mail className="w-5 h-5" />
                  {isGenerating ? "Enviando pedido..." : "Enviar pedido"}
                </Button>

                {totalSelectedMagnets !== orderInfo.totalMagnets && (
                  <p className="text-sm text-red-600">
                    Ajusta las cantidades para enviar el pedido ({totalSelectedMagnets}/{orderInfo.totalMagnets} imanes)
                  </p>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Se generará un PNG de máxima calidad (300 DPI)</p>
                  <p>• El archivo se subirá a la nube y se enviará el enlace por email</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface ImageCropperProps {
  image: CroppedImage
  maxQuantity: number
  onRemove: () => void
  onUpdate: (updates: Partial<CroppedImage>) => void
  onQuantityChange: (quantity: number) => void
}

const ImageCropper = ({ image, maxQuantity, onRemove, onUpdate, onQuantityChange }: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onUpdateRef = useRef(onUpdate)
  const [isDragging, setIsDragging] = useState(false)
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number; distance?: number } | null>(null)
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Keep the ref updated with the latest onUpdate function
  React.useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const cropImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageElement || !isImageLoaded) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Higher resolution for better quality (300 DPI equivalent)
    const size = 1200 // Increased from 800 to 1200 for even better quality
    canvas.width = size
    canvas.height = size

    // Fill ENTIRE canvas with WHITE background first
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, size, size)

    // Calculate image dimensions
    const imgAspect = imageElement.width / imageElement.height
    let drawWidth, drawHeight

    if (imgAspect > 1) {
      drawHeight = size * image.scale
      drawWidth = drawHeight * imgAspect
    } else {
      drawWidth = size * image.scale
      drawHeight = drawWidth / imgAspect
    }

    // Draw image
    const centerX = size / 2
    const centerY = size / 2
    const imgX = centerX - drawWidth / 2 + image.position.x * 2
    const imgY = centerY - drawHeight / 2 + image.position.y * 2

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // Create a temporary canvas for the rounded mask
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    tempCanvas.width = size
    tempCanvas.height = size

    // Fill temp canvas with white background
    tempCtx.fillStyle = "#FFFFFF"
    tempCtx.fillRect(0, 0, size, size)

    // Draw image on temp canvas
    tempCtx.imageSmoothingEnabled = true
    tempCtx.imageSmoothingQuality = "high"
    tempCtx.drawImage(imageElement, imgX, imgY, drawWidth, drawHeight)

    // Create rounded square mask on temp canvas
    const maskSize = size - 12
    const cornerRadius = 120 // Proportional to the higher resolution
    const maskX = (size - maskSize) / 2
    const maskY = (size - maskSize) / 2

    tempCtx.globalCompositeOperation = "destination-in"
    tempCtx.beginPath()
    tempCtx.roundRect(maskX, maskY, maskSize, maskSize, cornerRadius)
    tempCtx.fill()

    // Draw the masked result onto main canvas
    ctx.drawImage(tempCanvas, 0, 0)

    const croppedDataUrl = canvas.toDataURL("image/png", 1.0) // Changed to PNG for better quality
    onUpdateRef.current({ croppedDataUrl })
  }, [image.position.x, image.position.y, image.scale, imageElement, isImageLoaded])

  const handleImageLoad = useCallback(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setImageElement(img)
      setIsImageLoaded(true)
    }
    img.onerror = () => {
      console.error("Error loading image")
      setIsImageLoaded(false)
    }
    img.src = image.preview
  }, [image.preview])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setLastTouch({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastTouch) return

    const deltaX = e.clientX - lastTouch.x
    const deltaY = e.clientY - lastTouch.y

    onUpdate({
      position: {
        x: image.position.x + deltaX,
        y: image.position.y + deltaY,
      },
    })

    setLastTouch({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setLastTouch(null)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setLastTouch({ x: touch.clientX, y: touch.clientY })
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
      )
      setLastTouch({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance: distance,
      })
      setIsDragging(false)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && isDragging && lastTouch) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - lastTouch.x
      const deltaY = touch.clientY - lastTouch.y

      onUpdate({
        position: {
          x: image.position.x + deltaX,
          y: image.position.y + deltaY,
        },
      })

      setLastTouch({ x: touch.clientX, y: touch.clientY })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setLastTouch(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3, image.scale + delta))
    onUpdate({ scale: newScale })
  }

  React.useEffect(() => {
    handleImageLoad()
  }, [handleImageLoad])

  React.useEffect(() => {
    if (isImageLoaded && imageElement) {
      cropImage()
    }
  }, [cropImage, isImageLoaded, imageElement])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="relative mb-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="absolute top-2 right-2 z-10 w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="relative bg-gray-100 rounded-lg p-2 overflow-hidden">
            <div
              ref={containerRef}
              className="relative w-full aspect-square cursor-move select-none rounded-lg overflow-hidden image-container no-select"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              style={{
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                msUserSelect: "none",
              }}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full rounded-sm"
                style={{ aspectRatio: "1/1" }}
              />

              <canvas
                width={canvasRef.current?.width || 1200}
                height={canvasRef.current?.height || 1200}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
                ref={(el) => {
                  if (!el) return
                  const ctx = el.getContext("2d")
                  if (!ctx) return
                  const size = el.width
                  ctx.clearRect(0, 0, size, size)

                  const marginPx = 90 // Adjusted for higher resolution
                  const maskSize = size - marginPx * 2
                  const cornerRadius = 18 * 2

                  ctx.save()
                  ctx.fillStyle = "rgb(243, 244, 246,0.9)"
                  ctx.fillRect(0, 0, size, size)

                  ctx.globalCompositeOperation = "destination-out"
                  ctx.beginPath()
                  ctx.roundRect(marginPx, marginPx, maskSize, maskSize, cornerRadius)
                  ctx.fill()
                  ctx.restore()

                  ctx.save()
                  ctx.globalCompositeOperation = "source-over"
                  ctx.strokeStyle = "rgba(255,255,255,0.8)"
                  ctx.lineWidth = 6 // Adjusted for higher resolution
                  ctx.beginPath()
                  ctx.roundRect(marginPx, marginPx, maskSize, maskSize, cornerRadius)
                  ctx.stroke()
                  ctx.restore()
                }}
              />

              {!image.croppedDataUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-gray-500 text-center px-2">Arrastra para posicionar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Zoom</Label>
            <div className="relative px-3">
              <div className="relative h-6 bg-gray-200 rounded-lg">
                <div
                  className="absolute h-full bg-blue-500 rounded-lg transition-all duration-150"
                  style={{ width: `${((image.scale - 0.5) / 2.5) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 hover:scale-110 active:scale-95"
                  style={{ left: `${((image.scale - 0.5) / 2.5) * 100}%` }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    const slider = e.currentTarget.parentElement
                    if (!slider) return

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const rect = slider.getBoundingClientRect()
                      const percentage = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width))
                      const newScale = 0.5 + percentage * 2.5
                      onUpdate({ scale: Math.max(0.5, Math.min(3, newScale)) })
                    }

                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove)
                      document.removeEventListener("mouseup", handleMouseUp)
                    }

                    document.addEventListener("mousemove", handleMouseMove)
                    document.addEventListener("mouseup", handleMouseUp)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const slider = e.currentTarget.parentElement
                    if (!slider) return

                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      const rect = slider.getBoundingClientRect()
                      const touch = moveEvent.touches[0]
                      const percentage = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width))
                      const newScale = 0.5 + percentage * 2.5
                      onUpdate({ scale: Math.max(0.5, Math.min(3, newScale)) })
                    }

                    const handleTouchEnd = () => {
                      document.removeEventListener("touchmove", handleTouchMove)
                      document.removeEventListener("touchend", handleTouchEnd)
                    }

                    document.addEventListener("touchmove", handleTouchMove)
                    document.addEventListener("touchend", handleTouchEnd)
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span className="font-medium">{Math.round(image.scale * 100)}%</span>
                <span>300%</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Cantidad de copias</Label>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuantityChange(Math.max(0, image.quantity - 1))}
                disabled={image.quantity <= 0}
                className="w-10 h-10 p-0 flex-shrink-0"
              >
                <Minus className="w-4 h-4" />
              </Button>

              <Input
                type="number"
                min="0"
                max={maxQuantity}
                value={image.quantity === 0 ? "" : image.quantity}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    onQuantityChange(0)
                  } else {
                    const num = Number.parseInt(value) || 0
                    onQuantityChange(Math.max(0, Math.min(maxQuantity, num)))
                  }
                }}
                className="w-16 text-center text-base"
                placeholder="0"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuantityChange(Math.min(maxQuantity, image.quantity + 1))}
                disabled={image.quantity >= maxQuantity}
                className="w-10 h-10 p-0 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">Máximo: {maxQuantity}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MagnetCreator
