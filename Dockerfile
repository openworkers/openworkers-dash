# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Production stage
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=builder /app/dist/browser /usr/share/nginx/html

# Copy wasm manually (Angular asset config doesn't work reliably)
COPY --from=builder /app/node_modules/@openworkers/croner-wasm/dist/*.wasm /usr/share/nginx/html/assets/wasm/

# Add wasm MIME type
RUN echo 'types { application/wasm wasm; }' >> /etc/nginx/mime.types

# SPA routing config
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript application/wasm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|wasm)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
