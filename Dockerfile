FROM node:24.14.0
WORKDIR /usr/src/Discord-TTS-Bot

COPY --chown=personalsite:personalsite \
  package.json package-lock.json tsconfig.json ./

RUN npm install
RUN npm run build

CMD [ "npm", "start", "--ignore-scripts" ]