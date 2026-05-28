# Discord TTS Bot
Inspired by the original Discord TTS bot written in Rust, this project is an attempt to recreate the same bot using TypeScript, a language I am fluent in. Frequent issues with the bot being delayed and my lack of experience with Rust have led to this project.

## Prerequisites
- IQ at or above room temperature
- MySQL server
- NodeJS 24+
  - `nvm` is an excellent tool

## Installation
### Docker
This is the preferred installation method, as it handles a lot of the heavy lifting rather than you needing to learn a lot of coder things. It's also easier for ChatGPT to assist you with.
1. Install and setup Docker and MySQL
2. Clone the repository
3. Copy the `.env.example` to `.env`
4. Fill out the variables (Use `host.docker.internal` to access localhost)
5. `docker compose build`
6. `docker compose up -d`

### Pure Installation
For those wishing to contribute or prefer a manual installation, this option is available for your use.
1. Install and setup the prerequisites
2. Clone the repository
3. Copy the `.env.example` to `.env`
4. Fill out the variables
5. `corepack enable && corepack prepare pnpm@latest --activate`
6. `pnpm install`
7. `pnpm run prebuild`
8. `node dist/index.js`
> [!TIP]
> I am unsure if setting the PWD to dist is OK, I've tested on the root of the project so it can store the old connection data there.

## Roadmap
| Status | Topic |
| --- | --- |
| TTS | Done & tested |
| Auto reconnect | Done & tested |
| User settings | Done & tested |
| Setting PWD to dist | Needs testing |
| Mapping mentionables to human understandable | Done & tested |
| Pull nickname & language from DB on TTS | Done & tested |
| Server settings | Needs implementation |
| Cleanup eslint and prettier | Needs implementation |
| Fuzzing code for memory leaks | Needs review |
| Checking for `playerMap` logical mistakes | Needs review |