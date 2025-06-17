FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --force
RUN pnpm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config.docker.yaml ./config.yaml
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod
CMD ["sh", "-c", "pnpm run migration:run-prod && node dist/src/main.js"]
