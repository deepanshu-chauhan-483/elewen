FROM node:20-alpine
WORKDIR /app

# Install system deps (for sharp/vips)
RUN apk add --no-cache vips-dev build-base python3

# Set npm configs (IMPORTANT 🔥)
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 10 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 600000 \
 && npm config set strict-ssl false

# Copy only package files first (cache optimization)
COPY package*.json ./

# Clean + install
RUN npm cache clean --force \
 && npm install --legacy-peer-deps

# Copy rest of code
COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]
