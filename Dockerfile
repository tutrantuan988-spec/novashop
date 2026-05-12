# Multi-stage build for NovaShop
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy built frontend and server
COPY --from=frontend-build /app/dist ./dist
COPY server ./server
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

EXPOSE 3001
CMD ["node", "server/index.js"]
