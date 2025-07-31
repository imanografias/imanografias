import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react"

import type { OurFileRouter } from "@/app/api/uploadthing/core"

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

// Generar helpers para usar en el cliente
export const { useUploadThing } = generateReactHelpers<OurFileRouter>()
