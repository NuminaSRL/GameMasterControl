FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create empty shared directory if not exists
RUN mkdir -p ./shared

# Installa le dipendenze necessarie per l'upload
RUN npm install --save multer uuid
RUN npm install --save-dev @types/multer @types/uuid

# Verifichiamo il contenuto del file validators.ts prima della build
RUN cat validators.ts

# Build the application
RUN npm run build

# Verifichiamo che il file validators.js sia stato generato correttamente
RUN cat dist/validators.js

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the server with the correct entry point
CMD ["node", "--experimental-specifier-resolution=node", "./dist/index.js"]