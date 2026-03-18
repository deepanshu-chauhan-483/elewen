FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache vips-dev build-base python3

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]
