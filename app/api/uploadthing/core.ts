import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "32MB" } }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for userId:", metadata)
    console.log("file url", file.url)
    return { uploadedBy: metadata }
  }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
