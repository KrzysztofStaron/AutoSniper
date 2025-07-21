# AutoSniper 🚗

**Intelligent car search across all of Poland**

AutoSniper is a comprehensive automotive search platform that revolutionizes how people find cars in Poland. It combines web scraping, AI analysis, and intelligent filtering to provide users with the best car offers from multiple automotive portals.

## 🌟 Features

### 🔍 Multi-Platform Search
- **Simultaneous scraping** of major Polish automotive portals:
  - OtoMoto
  - OLX
  - Gratka
  - Samochody.pl
  - AutoPlac
- **Unified search interface** - no need to visit multiple websites
- **Real-time data collection** with intelligent caching

### 🤖 AI-Powered Analysis
- **Intelligent offer evaluation** using GPT-4
- **Price-to-value ratio analysis**
- **Vehicle history verification** against government databases
- **Image analysis** for vehicle condition assessment
- **Description matching** for precise filtering
- **Seller credibility assessment**

### 📧 Email-Based Results
- **Complete analysis reports** delivered via email
- **Top-rated offers** with detailed ratings
- **Direct links** to original listings
- **No registration required** - completely free

### 🌍 Multi-Language Support
- **Polish and English** interfaces
- **Localized content** and search results
- **Automatic language detection**

## 🏗️ Architecture

### Frontend (`auto_sniper/`)
Built with **Next.js 15**, **React 19**, and **TypeScript**

```
auto_sniper/
├── app/                    # Next.js App Router
│   ├── actions/           # Server actions
│   ├── search/            # Search interface
│   ├── results/           # Results display
│   └── pricing/           # Pricing information
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── SearchForm.tsx    # Main search form
│   └── SearchResults.tsx # Results display
└── lib/                  # Utilities and configurations
```

### Backend (`auto_sniper_backend/`)
Node.js/TypeScript backend with Express and Firebase

```
auto_sniper_backend/
├── src/
│   ├── search/           # Web scraping modules
│   │   ├── olx.ts       # OLX scraper
│   │   ├── otomoto.ts   # OtoMoto scraper
│   │   └── ...
│   ├── process/         # Data processing
│   │   ├── analyze.ts   # AI analysis
│   │   ├── distance.ts  # Location calculations
│   │   └── history.ts   # Vehicle history
│   ├── queue/           # Job queue system
│   ├── firestore/       # Firebase integration
│   └── utils/           # Utilities and helpers
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **pnpm** >= 10.0.0
- **Firebase** project setup
- **OpenAI API** key

### Frontend Setup

```bash
cd auto_sniper
pnpm install
pnpm dev
```

### Backend Setup

```bash
cd auto_sniper_backend
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Build and run
pnpm build
pnpm start
```

### Environment Variables

**Frontend (.env.local)**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

**Backend (.env)**
```env
OPENAI_API_KEY=your_openai_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
RESEND_API_KEY=your_resend_api_key
```

## 🔧 Development

### Available Scripts

**Frontend:**
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint
```

**Backend:**
```bash
pnpm dev          # Development with nodemon
pnpm build        # TypeScript compilation
pnpm start        # Production server
pnpm test         # Run tests
pnpm search       # Run search manually
pnpm process      # Process results
```

### Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## 📊 Data Flow

1. **User Input** → Search form with brand, model, year, location, price
2. **Query Processing** → Backend parses and validates search parameters
3. **Multi-Platform Scraping** → Simultaneous scraping of all automotive portals
4. **Data Enrichment** → Vehicle history, distance calculations, image analysis
5. **AI Analysis** → GPT-4 evaluates each offer based on multiple criteria
6. **Result Compilation** → Top offers ranked by AI score
7. **Email Delivery** → Complete report sent to user's email

## 🧠 AI Analysis Features

### Scoring Criteria
- **Price Analysis** (30%): Market value comparison
- **Mileage Assessment** (15%): Age-appropriate mileage
- **Distance Calculation** (10%): Proximity to user location
- **Year Evaluation** (10%): Vehicle age consideration
- **Visual Analysis** (10%): Image-based condition assessment
- **Description Matching** (15%): User requirements alignment
- **Government Data** (5%): Official database verification
- **History Quality** (5%): Available vehicle history

### Image Analysis
- **OpenAI Vision API** integration
- **Condition assessment** from photos
- **Feature detection** (color, style, modifications)
- **Damage identification**

## 🔒 Security & Performance

### Security Features
- **CORS protection** for API endpoints
- **Input validation** and sanitization
- **Rate limiting** on scraping operations
- **Secure Firebase** integration
- **Environment variable** protection

### Performance Optimizations
- **Intelligent caching** system
- **Parallel scraping** operations
- **Puppeteer optimization** for web scraping
- **Database indexing** for fast queries
- **CDN integration** for static assets

## 📈 Monitoring & Logging

### Structured Logging
- **Pino logger** for high-performance logging
- **JSON-structured** logs with metadata
- **Environment-based** log levels
- **Error tracking** with full context

### Log Levels
```bash
LOG_LEVEL=debug  # All logs
LOG_LEVEL=info   # Info and above
LOG_LEVEL=warn   # Warnings and errors
LOG_LEVEL=error  # Errors only
```

## 🛠️ API Endpoints

### Search Queue
```http
POST /queue
Content-Type: application/json

{
  "query": "BMW 320d 2020",
  "platform": "all",
  "userEmail": "user@example.com"
}
```

### Response
```json
{
  "success": true,
  "searchId": "unique-search-id",
  "dbPath": "searches/unique-search-id",
  "message": "Queued. Email will be sent when done."
}
```

## 🧪 Testing

### Test Coverage
- **Unit tests** for parsers and utilities
- **Integration tests** for scraping modules
- **API endpoint** testing
- **Error handling** validation

### Running Tests
```bash
# All tests
pnpm test

# Specific test file
pnpm test mileageParser.test.ts

# Coverage report
pnpm test:coverage
```

## 📦 Deployment

### Frontend (Vercel)
```bash
# Automatic deployment with Vercel
git push origin main
```

### Backend (Node.js Server)
```bash
# Build and deploy
pnpm build
pm2 start dist/main.js
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new functionality
5. **Submit** a pull request

### Code Style
- **TypeScript** with strict mode
- **ESLint** configuration
- **Prettier** formatting
- **Conventional commits**

## 📄 License

© 2024 AutoSniper. All rights reserved.

## 🆘 Support

For support and questions:
- **Email**: support@autosniper.com
- **Documentation**: [docs.autosniper.com](https://docs.autosniper.com)
- **Issues**: GitHub Issues

---

**AutoSniper** - Finding your dream car has never been easier! 🚗✨
