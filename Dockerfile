FROM node:20-alpine

WORKDIR /app

# Copy package file utama
COPY package*.json ./

# Copy package file server dan client
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install semua dependencies (Root, Server, dan Client)
RUN npm install
RUN npm install --prefix server
RUN npm install --prefix client

# Copy seluruh source code
COPY . .

# Expose port (opsional, sesuaikan dengan port vite/server kamu)
EXPOSE 3000 5000

CMD ["npm", "run", "dev"]



# FROM node:16-alpine

# WORKDIR /app

# COPY package* .
# RUN npm install

# COPY . .

# CMD ["npm", "run", "dev"]