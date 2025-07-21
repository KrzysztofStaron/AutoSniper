# Logging Implementation

This project now uses **Pino** for structured, high-performance logging throughout the codebase.

## Features

- **Fast Performance**: Pino is one of the fastest Node.js loggers
- **Structured Logging**: All logs are JSON-structured with metadata
- **Pretty Printing**: Beautiful console output in development
- **Log Levels**: Support for debug, info, warn, error levels
- **Environment-based Configuration**: Different settings for dev/production

## Usage

### Import the Logger

```typescript
import logger from "./src/utils/logger";
```

### Basic Logging

```typescript
logger.debug("Debug message", { metadata: "debug data" });
logger.info("Info message", { userId: 123 });
logger.warn("Warning message", { warning: true });
logger.error("Error message", { error: errorObject });
```

### Environment Variables

- `LOG_LEVEL`: Set logging level (debug, info, warn, error) - default: 'info'
- `NODE_ENV`: When set to 'production', disables pretty printing

### Examples

```bash
# Default logging (info level)
npm run dev

# Debug logging (shows all logs)
LOG_LEVEL=debug npm run dev

# Windows PowerShell
$env:LOG_LEVEL = "debug"; npm run dev
```

## Implementation Details

### Files Updated

1. **`src/utils/logger.ts`** - Logger configuration
2. **`src/utils/descriptionMatcher.ts`** - Comprehensive logging for description matching
3. **`src/process/looks.ts`** - Detailed logging for image analysis

### Logging Coverage

**Description Matcher (`descriptionMatcher.ts`)**:

- API request/response tracking
- Score calculation steps
- Error handling with context
- Performance metrics
- Keyword extraction details
- Semantic similarity calculations

**Image Analysis (`looks.ts`)**:

- Image conversion process
- OpenAI Vision API calls
- Response parsing
- Score evaluation
- Error handling with full context

### Log Levels Used

- **DEBUG**: Detailed internal operations, request/response details
- **INFO**: Important process steps, successful operations
- **WARN**: Fallback operations, non-critical issues
- **ERROR**: Failures, exceptions with full error context

## Benefits

1. **Debugging**: Easy to track what's happening in complex AI operations
2. **Monitoring**: Structured logs can be sent to log aggregation services
3. **Performance**: Track timing and performance of AI API calls
4. **Error Investigation**: Rich context when things go wrong
5. **Development**: Pretty-printed logs make development easier

## Example Output

```
[2025-06-11 23:04:06.847 +0200] INFO: Starting description score calculation
    userDescriptionLength: 34
    carDescriptionLength: 56
    hasUserDescription: true
    hasCarDescription: true
[2025-06-11 23:04:06.847 +0200] DEBUG: OpenAI request details
    model: "gpt-4o-mini"
    temperature: 0.1
    max_tokens: 10
    messageCount: 2
[2025-06-11 23:04:08.119 +0200] INFO: Description score calculated successfully
    score: 0.85
    userDescriptionPreview: "red sedan with automatic transmission..."
    carDescriptionPreview: "czerwony sedan z automatyczną skrzynią..."
```
