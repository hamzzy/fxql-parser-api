# Stage 1: Build
FROM node:18-alpine AS build

# Install build tools
RUN apk add --no-cache bash git

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies (only required for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy built application from the build stage
COPY --from=build /app/dist ./dist

# Expose application port
EXPOSE 4000

# Start the application
CMD ["node", "dist/index.js"]