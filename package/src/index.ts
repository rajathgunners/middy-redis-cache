import redisClient from "./redis-client"

type redisConfigType = {
    socket?: {
        host?: string;
        port?: number;
    },
    url?: string;
    password?: string;
}

type CacheConfigType = {
    skipCachingFunc?: Function;
    responseFunc?: Function;
    redisConfig?: redisConfigType;
    key?: string | Function;
    expire?: number;
};

let defaultConfig: CacheConfigType = {
    skipCachingFunc: (middyEvent: any) => !middyEvent?.response?.body,
    responseFunc: (cachedBody: string, middyEvent: any) => ({
        statusCode: 200,
        body: cachedBody,
    }),
    redisConfig: {
        socket: {
            host: "localhost",
            port: 6379,
        },
    },
    key: "TEST_KEY",
    expire: 24 * 60 * 60,
};

function getRedisKey(key: string | Function | undefined, middyEvent: any): string {
    let redisKey: string = "";
    if (typeof key === "string") redisKey = key;
    if (typeof key === "function") redisKey = key(middyEvent);
    return redisKey;
};

export function setDefaultConfig(configOptions: CacheConfigType): void {
    defaultConfig = {
        ...defaultConfig,
        ...configOptions,
    };
    redisClient.setRedisConfig(configOptions.redisConfig);
};

export default function redisCacheMiddleware(configOptions: CacheConfigType = {}): any {
    const beforeMiddleware: Function = async (middyEvent: any): Promise<void> => {
        try {
            const config: CacheConfigType = {
                ...defaultConfig,
                ...configOptions,
            };

            const { key, responseFunc }: { key?: string | Function, responseFunc?: Function } = config;
            const redisKey: string = getRedisKey(key, middyEvent);
            const cachedBody: string | null = await redisClient.getKey(redisKey);
            if (cachedBody) {
                return responseFunc?.(cachedBody, middyEvent);
            }
        } catch (error) {
            console.log("ERROR: Failed to get cache.", error);
        }
    };

    const afterMiddleware: Function = async (middyEvent: any): Promise<void> => {
        try {
            let config = {
                ...defaultConfig,
                ...configOptions,
            };
            const { key, expire }: { key?: string | Function, expire?: number } = config;
            const { response } = middyEvent;
            const redisKey = getRedisKey(key, middyEvent);
            response.statusCode === 200 &&
                !config.skipCachingFunc?.(middyEvent) &&
                (await redisClient.setKey(redisKey, response.body, expire));
            return;
        } catch (error) {
            console.log("ERROR: Failed to set cache.", error);
        }
    };

    return {
        before: beforeMiddleware,
        after: afterMiddleware,
    };
};