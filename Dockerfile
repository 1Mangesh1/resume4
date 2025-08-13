# Multi-stage Dockerfile for Resume Generator with Integrated LaTeX
FROM node:18-alpine AS base

# Install system dependencies and TeX Live
RUN apk add --no-cache \
    texlive \
    texlive-full \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p temp uploads && \
    chmod 755 temp uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV DOCKERIZED=true
ENV TEXLIVE_PATH=/usr/bin/pdflatex
ENV TEMP_DIR=/app/temp

# Start command
CMD ["npm", "start"]
