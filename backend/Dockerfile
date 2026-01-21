FROM node:18-alpine

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client for linux-musl
RUN npx prisma generate

# Copy application code
COPY . .

# Expose the port
EXPOSE 3002

# Start the application
CMD ["node", "server.js"]