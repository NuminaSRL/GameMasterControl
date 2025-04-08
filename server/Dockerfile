FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create empty shared directory to avoid errors
RUN mkdir -p ./shared

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copia prima solo i file package per sfruttare la cache di Docker
COPY package.json package-lock.json* ./

# Installa le dipendenze incluse quelle di sviluppo (necessarie per il build)
RUN npm install

# Copia il resto del codice
COPY . .

# Crea una directory shared vuota (necessaria per il build)
RUN mkdir -p ./shared

# Esegui il build
RUN npm run build

# Imposta le variabili d'ambiente
ENV NODE_ENV=production
ENV PORT=5000

# Esponi la porta
EXPOSE 5000

# Avvia il server - usiamo npm esplicitamente per evitare problemi
ENTRYPOINT ["npm", "run", "start"]