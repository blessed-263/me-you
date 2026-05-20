# API-only image for Railway (marketing site is on Vercel).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY tsconfig.server.json ./
COPY server ./server
RUN npm run build:server

FROM node:22-alpine AS release
WORKDIR /app
ENV NODE_ENV=production
ENV SERVE_STATIC=false
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist-server ./dist-server
EXPOSE 3001
CMD ["node", "dist-server/index.js"]
