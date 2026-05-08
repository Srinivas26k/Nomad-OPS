FROM oven/bun:alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install

# Copy all source files
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Cloud Run requirements
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

# Start the Next.js production server
CMD ["bun", "run", "start"]
