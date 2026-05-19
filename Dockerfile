# TypeScript BS
FROM node:24.14.0 AS builder
WORKDIR /usr/src/Discord-TTS-Bot

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm install
RUN npm run build

# ffmpeg
FROM node:24.14.0-slim AS runner
WORKDIR /usr/src/Discord-TTS-Bot

RUN apt update && \
    apt install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/Discord-TTS-Bot/package.json ./
COPY --from=builder /usr/src/Discord-TTS-Bot/node_modules ./node_modules
COPY --from=builder /usr/src/Discord-TTS-Bot/dist ./dist

ENV NODE_ENV=production

CMD [ "npm", "start", "--ignore-scripts" ]
