# TypeScript BS
FROM node:24.14.0 AS builder
WORKDIR /usr/src/Discord-TTS-Bot

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build
RUN pnpm prune --prod

# ffmpeg
FROM node:24.14.0-slim AS runner
WORKDIR /usr/src/Discord-TTS-Bot

RUN apt update && \
    apt install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/Discord-TTS-Bot/node_modules ./node_modules
COPY --from=builder /usr/src/Discord-TTS-Bot/dist ./dist
COPY --from=builder /usr/src/Discord-TTS-Bot/package.json ./

ENV NODE_ENV=production
USER node

CMD [ "npm", "start", "--ignore-scripts" ]
