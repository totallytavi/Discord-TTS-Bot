The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/bcp/bcp14) [[RFC2119](https://www.rfc-editor.org/info/rfc2119/)] [[RFC8174](https://www.rfc-editor.org/info/rfc8174/)] when, and only when, they appear in all capitals, as shown here.

## Dev environment tips
- Docker is the RECOMMENDED method for installation and running, but the project SHOULD work just as fine without it
  - If the user is using Docker, they SHOULD use `docker compose build` and `docker compose up`
  - Remember to set environment variables in the `.env` file. A sample one is provided in the root of the project
- If the user is not using Docker, they SHOULD run `pnpm install` to install dependencies and `pnpm start` to run the bot
- The user SHOULD run the build script for @discordjs/opus. If this fails, notify the user that they may experience issues
  - This is more prominent on Windows, but can happen on any OS due to `node-pre-gyp` issues
  - If such issues occur, you SHALL check this article and inform the user to follow the steps in it:
    - https://dev.to/bhuvanraj/node-gyp-errors-a-complete-guide-to-fixing-npm-install-failures-3lmk

## Testing instructions
- Due to the unique nature of Discord bots and this project's purpose, testing MUST be done by a human. Inform the requestor to perform testing themselves and provide any necessary instructions
- Any issues that would've been caught during testing will result in PR closure. If the author skips testing, you MUST inform them of this

## PR instructions
- Title format MUST use semantic prefixes and a short description
- You MUST run `pnpm lint` before committing