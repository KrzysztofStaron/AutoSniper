# Firebase Admin SDK Setup Guide

Your AutoSniper backend now uses **Firebase Admin SDK** which requires proper authentication. Here are three ways to set it up:

## Option 1: Service Account Key (Recommended)

### Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your `autosniper-f715f` project
3. Click **⚙️ Settings** → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### Step 2: Add to Environment Variables

Add this to your `.env` file:

```env
# Firebase Admin SDK - Service Account (JSON as string)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"autosniper-f715f","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Project ID
FIREBASE_PROJECT_ID=autosniper-f715f

# Other environment variables
RESEND_API_KEY=your-resend-api-key
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
```

**⚠️ Important:** Copy the entire JSON content as a single line string.

## Option 2: Application Default Credentials (Development)

### Step 1: Install Google Cloud CLI

```bash
# Install Google Cloud CLI
# Visit: https://cloud.google.com/sdk/docs/install
```

### Step 2: Authenticate

```bash
# Login to Google Cloud
gcloud auth application-default login

# Set project
gcloud config set project autosniper-f715f
```

### Step 3: Environment Variables

Add only this to your `.env` file:

```env
# Firebase Project ID
FIREBASE_PROJECT_ID=autosniper-f715f

# Other environment variables
RESEND_API_KEY=your-resend-api-key
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
```

## Option 3: Minimal Setup (Testing Only)

If you just want to test quickly, add this to your `.env`:

```env
# Firebase Project ID only
FIREBASE_PROJECT_ID=autosniper-f715f

# Other environment variables
RESEND_API_KEY=your-resend-api-key
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
```

**Note:** This might work if your Firebase project has permissive rules, but it's not recommended for production.

## Firestore Security Rules

Update your Firestore rules to allow server-side access:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → **Firestore Database** → **Rules**
3. Replace with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all operations for server-side Admin SDK
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Security Warning:** These rules allow full access. For production, implement proper security rules based on your authentication system.

## Testing Your Setup

After setting up authentication, test your system:

```bash
# Start the server
pnpm run dev

# Should see no permission errors
# Test the API
curl -X POST http://localhost:5000/search \
  -H "Content-Type: application/json" \
  -d @test-queue-request.json
```

## Troubleshooting

### Error: "Permission denied"

- Make sure Firestore API is enabled
- Check your service account key is valid
- Verify Firestore security rules allow access

### Error: "Project not found"

- Verify `FIREBASE_PROJECT_ID` matches your actual project ID
- Check that you have access to the project

### Error: "Invalid private key"

- Ensure the entire JSON key is copied correctly
- Check for escaped quotes or newlines in the JSON

## Production Recommendations

For production deployment:

1. ✅ Use **Service Account Key** (Option 1)
2. ✅ Store the key securely (e.g., encrypted environment variables)
3. ✅ Implement proper Firestore security rules
4. ✅ Rotate service account keys regularly
5. ✅ Use least-privilege permissions

Your AutoSniper backend will now have full admin access to Firestore without permission issues! 🚀
