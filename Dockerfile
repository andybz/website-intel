FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# SvelteKit's build-time route analysis imports server modules, which
# includes our DATABASE_URL startup check - this placeholder just satisfies
# that check at build time; docker-compose's real DATABASE_URL overrides it
# at runtime (image ENV values are overridden by compose `environment:`).
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
RUN npm run build && chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
