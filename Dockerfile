FROM node:12-alpine
WORKDIR /build

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY source source
RUN npx tsc

RUN rm -rf node_modules && npm ci --production


FROM node:12-alpine
WORKDIR /app
VOLUME /app/persist
VOLUME /app/tmp
VOLUME /app/wikidata-cache

ENV NODE_ENV=production
ENV NODE_ICU_DATA="node_modules/full-icu"

COPY --from=0 /build/node_modules ./node_modules
COPY locales locales
COPY wikidata-items.yaml ./
COPY --from=0 /build/dist ./

CMD node -r source-map-support/register index.js
