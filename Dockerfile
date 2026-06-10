# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies required for building native addons and Prisma
RUN apk add --no-cache openssl

# Copy package files first to leverage Docker cache
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client (Needs dummy DATABASE_URL to avoid env errors during build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run db:generate

# Build the TypeScript code (compiles to dist/)
RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Install necessary runtime dependencies (openssl for Prisma, bash for entrypoint)
RUN apk add --no-cache openssl bash

# Set environment to production
ENV NODE_ENV=production

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Generate Prisma Client again for the production environment
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copy the compiled code and templates from the builder stage
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Expose the port the API will run on
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command runs the API server
CMD ["node", "dist/server.js"]
