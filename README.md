# Discord TTS Bot
Inspired by the original Discord TTS bot written in Rust, this project is an attempt to recreate the same bot using TypeScript, a language I am fluent in. Frequent issues with the bot being delayed and my lack of experience with Rust have led to this project.

## Prerequisites
- IQ at or above room temperature
- MySQL server
- NodeJS 24+
  - `nvm` is an excellent tool

## Installation
1. Install and setup the prerequisites
2. Clone the repository
3. Copy the `.env.example` to `.env`
4. Fill out the variables
5. `npm install`
6. `npx tsc -b`
7. `node dist/index.js`
> [!TIP]
> I am unsure if setting the PWD to dist is OK, I've tested on the root of the project so it can store the old connection data there.

## Roadmap
| Status | Topic |
| --- | --- |
| TTS | Done & tested |
| Auto reconnect | Done & tested |
| User settings | Needs testing |
| Setting PWD to dist | Needs testing |
| Mapping mentionables to human understandable | Needs implementation (Priority!) |
| Pull nickname & language from DB on TTS | Needs implementation (Priority!) |
| Server settings | Needs implementation |