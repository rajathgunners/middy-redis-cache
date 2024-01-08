import { createClient, RedisClientType, /*RedisClientOptions*/ } from "@redis/client";

let redisConfig: any;
let client: RedisClientType;

const connectRedis = async () => {
    client = createClient(redisConfig);
    client.on("connect", () => console.log("Redis Client Connected"));
    client.on("error", (error) => console.log("Redis Client Error", error));
    await client.connect();
};

const setRedisConfig = (redisConfigObj = {}) => {
    redisConfig = redisConfigObj;
    connectRedis();
};

const setKey = async (key: string, value: string, expire: number | undefined): Promise<void> => {
    if (!client?.isReady) return;
    client.set(key, value);
    if (expire) client.expire(key, expire);
};

const getKey = async (key: string): Promise<string | null> => {
    if (!client?.isReady) return null;
    let value = await client.get(key);
    return value;
};

export default {
    getKey,
    setKey,
    setRedisConfig,
};
