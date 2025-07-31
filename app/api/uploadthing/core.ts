import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "64MB", // Aumentado de 32MB a 64MB
      maxFileCount: 20, // Aumentado para múltiples páginas
    },
  })
    .middleware(async ({ req }) => {
      // You can add authentication here if needed
      return {}
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata)
      console.log("file url", file.url)
      return { uploadedBy: "system" }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
