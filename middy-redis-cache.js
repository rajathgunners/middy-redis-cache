const { setRedisConfig, getKey, setKey } = require("./redis-client");

let defaultConfig = {
  skipCachingFunc: (middyEvent) => !middyEvent?.response?.body,
  responseFunc: (cachedBody, middyEvent) => ({
    statusCode: 200,
    body: cachedBody,
  }),
  redisConfig: {
    socket: {
      host: "localhost",
      port: "6379",
    },
  },
  key: "TEST_KEY",
  expire: 24 * 60 * 60,
};

const setDefaultConfig = (configOptions) => {
  defaultConfig = {
    ...defaultConfig,
    ...configOptions,
  };
  setRedisConfig(configOptions.redisConfig);
};

const getRedisKey = (key, middyEvent) => {
  if (typeof key === "string") return key;
  if (typeof key === "function") return key(middyEvent);
};

const redisCacheMiddleware = (configOptions = {}) => {
  const beforeMiddleware = async (middyEvent) => {
    try {
      const config = {
        ...defaultConfig,
        ...configOptions,
      };

      const { key, responseFunc } = config;
      const redisKey = getRedisKey(key, middyEvent);
      const cachedBody = await getKey(redisKey);
      if (cachedBody) {
        return responseFunc(cachedBody, middyEvent);
      }
    } catch (error) {
      console.log("ERROR: Failed to get cache.", error);
    }
  };

  const afterMiddleware = async (middyEvent) => {
    try {
      let config = {
        ...defaultConfig,
        ...configOptions,
      };
      const { key, expire } = config;
      const { response } = middyEvent;
      const redisKey = getRedisKey(key, middyEvent);
      response.statusCode === 200 &&
        !config.skipCachingFunc?.(middyEvent) &&
        (await setKey(redisKey, response.body, expire));
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

module.exports = {
  setDefaultConfig,
  redisCacheMiddleware,
};
