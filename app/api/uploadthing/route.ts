import { createRouteHandler } from "uploadthing/next"
import { ourFileRouter } from "./core"

// Export handlers for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    logLevel: "Debug",
  },
})
