FROM docker.io/library/node:14-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY source source
RUN node_modules/.bin/tsc


FROM docker.io/library/node:14-alpine AS packages
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --production


FROM docker.io/library/node:14-alpine
WORKDIR /app
VOLUME /app/persist
VOLUME /app/tmp

ENV NODE_ENV=production
ENV NODE_ICU_DATA="node_modules/full-icu"

COPY --from=packages /build/node_modules ./node_modules
COPY locales locales
COPY wikidata-items.yaml ./
COPY --from=builder /build/dist ./

CMD node --unhandled-rejections=strict -r source-map-support/register index.js
