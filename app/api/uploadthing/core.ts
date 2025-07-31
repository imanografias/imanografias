import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "64MB", // Aumentado para archivos grandes
      maxFileCount: 20, // Permitir múltiples archivos
    },
  })
    .middleware(async ({ req }) => {
      // Middleware opcional para autenticación
      console.log("Upload middleware executed")
      return { userId: "system" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      })

      return {
        uploadedBy: metadata.userId,
        url: file.url,
        name: file.name,
        size: file.size,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
