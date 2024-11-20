# FXQL (Foreign Exchange Query Language) Parser

## Project Overview

This project implements a custom parsing system for Foreign Exchange (FXQL) statements, allowing users to define currency pair transactions with buy, sell, and cap amounts.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environmental Variables](#environmental-variables)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

- Parse complex Foreign Exchange statements
- Validate currency pairs and transaction amounts
- Store parsed statements in a database
- Comprehensive error handling
- Supports multiple currency pair statements in a single request

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL (or your preferred database)
- Docker (optional, for containerization)

## Local Development Setup

### 1. Clone the Repository

```bash
 git clone https://github.com/hamzzy/fxql-parser-api.git
 cd fxql-parser
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/fxql_db?schema=public"

# Application Configuration
PORT=3000
```

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Optional: Seed initial data
npx prisma db seed
```

### 5. Run the Application

```bash
# Development mode
npm run start:dev
# or
yarn start:dev

# Production mode
npm run start:prod
# or
yarn start:prod
```

## Environmental Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `PORT` | Application listening port | 3000 | No |

## API Documentation

### Endpoint: `POST /api/fxql-statements`

#### Request Payload
```json
{
  "FXQL": "USD-GBP { BUY 100 SELL 0.85 CAP 10000 }\nEUR-JPY { BUY 50 SELL 145.20 CAP 50000 }"
}
```

#### Successful Response
```json
{
  "message": "FXQL Statement Parsed Successfully.",
  "code": "FXQL-200",
  "data": [
    {
      "EntryId": 1,
      "SourceCurrency": "USD",
      "DestinationCurrency": "GBP",
      "SellPrice": 0.85,
      "BuyPrice": 100,
      "CapAmount": 10000
    }
  ]
}
```

#### Error Response
```json
{
  "message": "Invalid currency format",
  "code": "FXQL-400",
  "details": "Specific error information"
}
```

## Design Decisions

### Parsing Strategy
- Lexer-Parser architecture for robust statement parsing
- Stateless parsing with comprehensive error collection
- Support for multiple statements in a single request

### Currency Validation
- Strict 3-letter uppercase currency code validation
- Predefined list of supported currencies
- Prevents parsing of unsupported or malformed currency pairs

### Error Handling
- Granular error tracking
- Preserves parsing context (line, column)
- Returns multiple errors if present
- Provides clear, actionable error messages

### Performance Considerations
- Atomic database transactions
- Efficient input normalization
- Limit of 1000 currency pairs per request to prevent system overload

## Testing

### Running Tests

```bash
# Unit tests
npm run test
# or
yarn test

# Coverage report
npm run test:cov
# or
yarn test:cov
```

### Test Coverage
- Parser validation
- Service logic
- Controller interactions
- Error scenario handling

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t fxql-parser .

# Run Docker container
docker run -p 3000:3000 fxql-parser
```

## Troubleshooting

- Ensure all environment variables are correctly set
- Check database connectivity
- Verify Node.js and npm versions
- Review application logs for detailed error information

