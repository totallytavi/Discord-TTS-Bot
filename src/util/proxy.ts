import { type createClient } from 'redis';
import { ProxyAgent } from 'undici';

const PROXIES = process.env.PROXY_SERVERS?.split(" ");

let currentProxy = 0;
function getNextProxy(): string {
  if (!PROXIES) return "";
  currentProxy = (currentProxy + 1) % PROXIES.length;
  return PROXIES[currentProxy] as string;
}

async function fetchUrl(url: string, redisClient?: ReturnType<typeof createClient>): Promise<Buffer|undefined> {
  if (!PROXIES || !redisClient) {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buf) => Buffer.from(buf));
  }

  const cacheKey = `tts:${Buffer.from(url).toString('base64')}`;
  try {
    const cache = await redisClient.get(cacheKey);
    if (cache) {
      return Buffer.from(cache, 'base64')
    }
  } catch(err) {
    console.error("Cache read failed, falling back to manual request", err);
  }

  try {
    const resp = await fetch(url, {
      // Recommended on Node 20+: https://stackoverflow.com/a/76159546
      dispatcher: new ProxyAgent(getNextProxy()) as any,
    });

    if (!resp.ok) {
      throw new Error("Request was not OK");
    }

    const buf = Buffer.from(await resp.arrayBuffer());
    try {
      redisClient.set(cacheKey, buf.toBase64());
    } catch(err) {
      console.error("Cache write failed", err);
    }

    return buf;
  } catch(err) {
    console.error("Couldn't proxy request");
    return;
  }
}

export {
  fetchUrl
}