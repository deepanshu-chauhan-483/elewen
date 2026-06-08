# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache vips-dev build-base python3

COPY package*.json ./
# postinstall runs patch-strapi-hmr-port.mjs; copy it before npm ci
COPY scripts/patch-strapi-hmr-port.mjs scripts/patch-strapi-hmr-port.mjs
RUN npm ci --legacy-peer-deps

COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache vips-dev

ENV NODE_ENV=production

COPY --from=build /app ./

EXPOSE 1337
CMD ["npm", "run", "start"]

FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache vips-dev build-base python3

COPY package*.json ./
COPY scripts/patch-strapi-hmr-port.mjs scripts/patch-strapi-hmr-port.mjs
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 1337
CMD ["npm", "run", "develop"]
