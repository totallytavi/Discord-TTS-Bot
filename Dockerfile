FROM node:24.14.0
WORKDIR /usr/src/Discord-TTS-Bot

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm install
RUN npm run build

CMD [ "npm", "start", "--ignore-scripts" ]
