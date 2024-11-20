# Stage 1: Build
FROM node:18-alpine AS build

# Install build tools
RUN apk add --no-cache bash git

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (production + dev)
RUN npm ci

# Copy the entire source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install npm explicitly (if missing in alpine image)
RUN apk add --no-cache nodejs npm

# Copy only production dependencies
COPY package*.json ./
RUN npm ci

# Copy built application from the build stage
COPY --from=build /app/dist ./dist

# Expose application port
EXPOSE 4000

# Start the application
CMD ["node", "dist/index.js"]