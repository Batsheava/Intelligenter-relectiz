# ===============================================================
#  Dockerfile — Intelligenter Project
# ===============================================================

FROM node:20-bullseye AS build
WORKDIR /app

# Copy package metadata and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and compile
COPY . .
RUN npx tsc

# ---------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------
FROM node:20-alpine
WORKDIR /app

# Copy only what is needed for runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/app.db ./     

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "dist/server.js"]
