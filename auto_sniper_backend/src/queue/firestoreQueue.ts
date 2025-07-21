import { runSearchesForAPI, SearchPlatform } from "../search";
import { processData } from "../process/process";
import { analizeListings } from "../analize/analize";
import { getNextPendingJob, updateJobStatus, saveSearchResults, markJobFailed, QueueJob } from "../firestore/firebase";
import { sendEmail } from "../email/email";
import { searchQuery } from "../types";
import { getFilteredListings } from "../analize/filter";

class FirestoreQueue {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  start() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log("Queue processor started");

    // Check for new jobs every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processNextJob().catch(console.error);
    }, 5000);
  }

  stop() {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log("Queue processor stopped");
  }

  private async processNextJob(): Promise<void> {
    try {
      const job = await getNextPendingJob();
      if (!job) return;

      console.log(`Processing job ${job.id}`);
      await updateJobStatus(job.id, "processing");

      await this.executeJob(job);
    } catch (error) {
      console.error("Error processing job:", error);
    }
  }

  private async executeJob(job: QueueJob): Promise<void> {
    try {
      const { searchId, query, platform, userEmail } = job;

      // Run the search
      const listings = await runSearchesForAPI(query, platform as SearchPlatform);

      // Process the data
      const processedListings = await processData(listings, query);

      // Analyze the listings
      const filteredListings = await getFilteredListings(processedListings, query);
      const analyzedListings = await analizeListings(filteredListings, query);

      // Save results
      await saveSearchResults(searchId, analyzedListings);

      // Send success email
      await this.sendEmail(userEmail, searchId, query, analyzedListings.length);

      // Mark as completed
      await updateJobStatus(job.id, "completed");

      console.log(`Job ${job.id} completed`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await markJobFailed(job.id, job.searchId, errorMessage);

      // Send error email
      await this.sendErrorEmail(job.userEmail, job.query, errorMessage);
    }
  }

  private async sendEmail(userEmail: string, searchId: string, query: any, totalResults: number): Promise<void> {
    const dbPath = `searches/${searchId}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Search is Complete! 🚗</h2>
        <p>Your search for <strong>${query.brand} ${query.model} ${query.year}</strong> found ${totalResults} results.</p>
        <p>You can access your results here: 
          <a href="https://auto-sniper-mocha.vercel.app//results/${searchId}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Results
          </a>
        </p>
      </div>
    `;

    try {
      await sendEmail(userEmail, `Search Complete: ${query.brand} ${query.model} (${totalResults} results)`, emailHtml);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }

  private async sendErrorEmail(userEmail: string, query: any, error: string): Promise<void> {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Search Failed ❌</h2>
        <p>Your search for <strong>${query.brand} ${query.model} ${query.year}</strong> failed.</p>
        <p>Error: ${error}</p>
      </div>
    `;

    try {
      await sendEmail(userEmail, `Search Failed: ${query.brand} ${query.model}`, emailHtml);
    } catch (error) {
      console.error("Failed to send error email:", error);
    }
  }
}

// Create and export the queue instance
export const firestoreQueue = new FirestoreQueue();
