# Multi-stage Dockerfile for Render / Docker deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install root, frontend, and backend dependencies
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy application source code
COPY . .

# Build frontend production bundle
RUN cd frontend && npm run build
RUN cd backend && (npm run build || true)

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Copy dependencies and built code from builder
COPY --from=builder /app /app

EXPOSE 10000

CMD ["npm", "start"]
