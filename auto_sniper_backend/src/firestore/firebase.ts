import "dotenv/config";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { searchQuery } from "../types";

// Initialize Firebase Admin
const apps = getApps();
let app;

if (apps.length === 0) {
  // Try to initialize with service account from service.json
  try {
    const serviceAccount = require("../../service.json");
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
} else {
  app = apps[0];
}

const db = getFirestore(app);

export interface QueueJob {
  id: string;
  searchId: string;
  query: searchQuery;
  platform: string;
  userEmail: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  error?: string;
}

// Add job to queue
export async function addJobToQueue(query: searchQuery, platform: string, userEmail: string): Promise<string> {
  const jobId = uuidv4();
  const searchId = uuidv4();

  const job: QueueJob = {
    id: jobId,
    searchId,
    query,
    platform,
    userEmail,
    status: "pending",
    createdAt: new Date(),
  };

  // Create both the job and the search result placeholder
  await db.collection("queueJobs").doc(jobId).set(job);
  await db.collection("searches").doc(searchId).set({
    id: searchId,
    query,
    platform,
    userEmail,
    status: "processing",
    createdAt: new Date(),
  });

  return searchId;
}

// Get next job to process
export async function getNextPendingJob(): Promise<QueueJob | null> {
  const snapshot = await db
    .collection("queueJobs")
    .where("status", "==", "pending")
    .orderBy("createdAt", "asc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { ...doc.data(), id: doc.id } as QueueJob;
}

// Update job status
export async function updateJobStatus(jobId: string, status: string): Promise<void> {
  await db.collection("queueJobs").doc(jobId).update({ status });
}

// Helper function to recursively remove undefined values from objects
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item));
  }

  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }

  return obj;
}

// Save search results
export async function saveSearchResults(searchId: string, results: any): Promise<void> {
  // Clean the results to remove undefined values
  const cleanedResults = removeUndefinedValues(results);

  await db.collection("searches").doc(searchId).update({
    results: cleanedResults,
    status: "completed",
    completedAt: new Date(),
  });
}

// Mark job as failed
export async function markJobFailed(jobId: string, searchId: string, error: string): Promise<void> {
  await db.collection("queueJobs").doc(jobId).update({
    status: "failed",
    error,
  });

  await db.collection("searches").doc(searchId).update({
    status: "failed",
    error,
    completedAt: new Date(),
  });
}

export { db };
