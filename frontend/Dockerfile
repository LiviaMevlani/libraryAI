# Frontend (Vite + React) - Node 22 (required by newer Vite)
FROM node:22-alpine

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies (reproducible)
RUN npm ci

# Copy source
COPY . .

# Build for production
RUN npm run build

# Vite preview port
EXPOSE 5173

# Serve the built app
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
