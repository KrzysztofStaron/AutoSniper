import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { addJobToQueue } from "./firestore/firebase";
import { firestoreQueue } from "./queue/firestoreQueue";

const app = express();
const port = 5000;

// Simple async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware
app.use(cors()); // Allow CORS for all origins
app.use(express.json());

// Timeout middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(60000, () => {
    res.status(408).json({ error: "Request timeout" });
  });
  res.setTimeout(60000, () => {
    res.status(408).json({ error: "Response timeout" });
  });
  next();
});

// Simple queue endpoint
app.post(
  "/queue",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { query, platform, userEmail } = req.body;

      // Basic validation
      if (!query || !userEmail) {
        return res.status(400).json({
          error: "Missing query or userEmail",
        });
      }

      // Add to queue
      const searchId = await addJobToQueue(query, platform || "all", userEmail);

      res.json({
        success: true,
        searchId,
        dbPath: `searches/${searchId}`, // This is the path in Firestore
        message: "Queued. Email will be sent when done.",
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to queue",
      });
    }
  })
);

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Queue endpoint: POST http://localhost:${port}/queue`);

  // Start queue processor
  firestoreQueue.start();
});

// Set server timeout to 60 seconds
server.timeout = 60000;

// Graceful shutdown
process.on("SIGTERM", () => {
  firestoreQueue.stop();
  server.close(() => {
    process.exit(0);
  });
});
