FROM docker.io/bitnami/node:14 AS builder
WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY source source
RUN node_modules/.bin/tsc

RUN rm -rf node_modules && npm ci --production


FROM docker.io/bitnami/node:14-prod
WORKDIR /app
VOLUME /app/persist
VOLUME /app/tmp

ENV NODE_ENV=production
ENV NODE_ICU_DATA="node_modules/full-icu"

COPY --from=builder /build/node_modules ./node_modules
COPY locales locales
COPY wikidata-items.yaml ./
COPY --from=builder /build/dist ./

CMD node --unhandled-rejections=strict -r source-map-support/register index.js
