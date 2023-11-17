const { createClient } = require("@redis/client");

let redisConfig = {};
let client;

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

const setKey = async (key, value, expire) => {
  if (!client?.isReady) return null;
  client.set(key, value, expire);
  return;
};

const getKey = async (key) => {
  if (!client?.isReady) return null;
  let value = await client.get(key);
  return value;
};

module.exports = {
  getKey,
  setKey,
  setRedisConfig,
};
