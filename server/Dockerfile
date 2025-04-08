FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code (inclusi riferimenti alla cartella shared)
COPY . .

# Crea la cartella shared se non esiste
RUN mkdir -p ./shared

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy build artifacts from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Start the server
CMD ["npm", "run", "start"]