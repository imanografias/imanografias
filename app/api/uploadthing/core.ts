import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "64MB", maxFileCount: 20 } })
    .middleware(async ({ req }) => {
      // Middleware simple - solo retornamos metadata básica
      return { uploadedBy: "system" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Log del archivo subido exitosamente
      console.log("Upload complete for:", metadata.uploadedBy)
      console.log("File URL:", file.url)

      // Retornar la información del archivo
      return { uploadedBy: metadata.uploadedBy }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
