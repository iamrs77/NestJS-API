# ---- Build stage: install all packages and compile the TypeScript ----
FROM node:24-slim AS build

# Prisma needs OpenSSL
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy the package files first so Docker can cache "npm ci"
# (the Prisma schema is needed because installing @prisma/client generates the client)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Run stage: only what the API needs to run ----
FROM node:24-slim

RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

# don't run as root
USER node

EXPOSE 3000

# apply any new database migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
