# AutoSniper Firestore Queue System

This queue system processes car search requests asynchronously using Firestore as the backend storage.

## Environment Variables Required

Add these to your `.env` file:

```env
# Firebase Configuration
FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# OpenAI Configuration (if used)
OPENAI_API_KEY=your-openai-api-key
```

## No Additional Setup Required! 🎉

Unlike Redis-based queues, the Firestore queue system requires **no additional services** to run:

- ✅ No Redis server installation needed
- ✅ No Docker containers to manage
- ✅ Uses your existing Firestore database
- ✅ Scales automatically with Firebase

## How It Works

1. **POST /search** - Creates a job document in Firestore `queueJobs` collection
2. **Queue Processor** - Polls Firestore every 5 seconds for pending jobs
3. **Job Execution** - Processes jobs with progress tracking
4. **Email Notification** - Sends email with results link when completed
5. **GET /search/:searchId** - Frontend retrieves results from `searchResults` collection

## Firestore Collections

### `queueJobs` Collection

- **Purpose**: Stores job queue with status tracking
- **Status**: `pending` → `processing` → `completed`/`failed`
- **Retry Logic**: Failed jobs retry up to 3 times with exponential backoff
- **Cleanup**: Completed jobs auto-deleted after 24 hours

### `searchResults` Collection

- **Purpose**: Stores final search results with listings
- **Access**: Retrieved by UUID token from email links
- **Persistence**: Results stored permanently for user access

## Queue Features

- **✅ Automatic Retry**: Failed jobs retry up to 3 times (5s → 10s → 20s delays)
- **✅ Progress Tracking**: Jobs report progress (10% → 40% → 70% → 90% → 100%)
- **✅ Email Notifications**: Success and failure emails sent automatically
- **✅ Persistent Storage**: All data stored in Firestore with UUID tokens
- **✅ Auto Cleanup**: Old completed jobs automatically removed
- **✅ No Dependencies**: No external services required
- **✅ Scalable**: Handles multiple concurrent jobs

## API Usage

### Search Request (requires email):

```json
{
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "location": { "lat": 52.2297, "lon": 21.0122 },
  "platform": "all",
  "userEmail": "user@example.com"
}
```

### Search Response (immediate):

```json
{
  "success": true,
  "searchId": "uuid-here",
  "message": "Search started successfully. You will receive an email when completed.",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Queue Status:

```bash
GET /queue/status
```

Response:

```json
{
  "success": true,
  "queue": {
    "pending": 2,
    "processing": 1,
    "completed": 15,
    "failed": 0
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Get Results:

```bash
GET /search/{searchId}
```

Returns full search results with status, listings, and metadata.

## Testing

Test the system with the provided test file:

```bash
# Send test request
curl -X POST http://localhost:5000/search \
  -H "Content-Type: application/json" \
  -d @test-queue-request.json

# Check queue status
curl http://localhost:5000/queue/status

# Monitor server logs to see job processing
pnpm run dev
```

## Architecture Benefits

- **🚀 Simpler Setup**: No Redis installation required
- **💰 Cost Effective**: Uses existing Firestore instance
- **🔄 Reliable**: Firestore handles persistence and transactions
- **📊 Observable**: Easy to monitor jobs in Firebase Console
- **🌍 Distributed**: Can run multiple server instances safely
- **🔒 Secure**: Leverages Firebase security rules
