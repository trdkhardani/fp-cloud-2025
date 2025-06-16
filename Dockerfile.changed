# FaceAttend Frontend Dockerfile
# ===============================

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

RUN apk add --no-cache openssl nginx

RUN mkdir -p /etc/ssl/private /etc/ssl/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost" && \
    chmod 600 /etc/ssl/private/nginx-selfsigned.key

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 443 (https)
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    # CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
    CMD wget --no-verbose --tries=1 --spider https://localhost/ --no-check-certificate || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 