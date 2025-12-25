FROM node:22-slim AS builder

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install dependencies
RUN npm install

# Build backend
RUN npx turbo run build --filter=timesheet_backend

# Production stage
FROM node:22-slim

WORKDIR /app

# Copy node_modules (including workspace links/hoisted deps)
# Note: For a smaller image, we'd use 'turbo prune', but copying full modules is safer for this setup.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/timesheet_backend/dist ./dist
COPY --from=builder /app/timesheet_backend/src ./src
COPY --from=builder /app/timesheet_backend/package.json ./
COPY --from=builder /app/timesheet_backend/tsconfig.json ./

# Development stage
FROM node:22-slim AS dev
WORKDIR /app
# Install procps for NestJS watch mode
RUN apt-get update && apt-get install -y procps
COPY --from=builder /app /app
CMD ["npm", "run", "dev", "-w", "timesheet_backend"]

# Set environment
ENV NODE_ENV=production
ENV DB_TYPE=sqlite
ENV DB_DATABASE=/app/data/timesheet.sqlite
ENV JWT_SECRET=docker-secret-change-me

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data

EXPOSE 3000

CMD ["node", "dist/main"]