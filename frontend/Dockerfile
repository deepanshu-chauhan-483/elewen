# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=https://api.elewen.co.in
ARG VITE_STRAPI_URL=https://strapi.elewen.co.in
ARG VITE_USE_FALLBACK=false

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRAPI_URL=$VITE_STRAPI_URL
ENV VITE_USE_FALLBACK=$VITE_USE_FALLBACK

RUN npm run build

FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
