# ============================================
# docker/backend.Dockerfile
# ============================================
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS development
RUN npm ci
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npx prisma generate
EXPOSE 3002
CMD ["npm", "start"]