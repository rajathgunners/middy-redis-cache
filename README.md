# middy-redis-cache

A middy middleware to cache response from serverless API Gateway routes

This package will help you add caching to routes with minimum code.

[@middy/core](https://middy.js.org/) package is used to add the redis middleware to your route

## Installation

To install middy-redis-cache, simply:

```bash
npm install @devraj95/middy-redis-cache
```

## Usage

### Basic Example

```typescript
import middy from "@middy/core";
import redisCacheMiddleware, { setDefaultConfig } from "@devraj95/middy-redis-cache";

// sets caching config for all middleware calls of middy-redis-cache
setDefaultConfig({
    skipCachingFunc: (middyEvent: any) => middyEvent?.response?.body === "{}" || middyEvent?.response?.body === null,
    redisConfig: {
        password: <<PASSWORD>>,
        socket: {
            host: <<HOST>>,
            port: <<PORT>>,
        },
    },
});

export const getEmployee = middy(async (event: any) => {
    try {
        const { employeeId = "" }: { employeeId: string } = event?.pathParameters;

        console.log(`Inside getEmployee Details for employeeId: ${employeeId}`);

        const employee = fetchEmployeeDetails(employeeId) // function to fetch employee details

        return {
            statusCode: 200,
            body: JSON.stringify(employee),
        };
    } catch (error: any) {
        console.log("Error in fetching employees data", error);
        return {
            statusCode: 400,
            body: error.message,
        };
    }
}).use(
    redisCacheMiddleware({
        expire: 30 * 60,
        key: (middyEvent: any) => {
            const { employeeId } = middyEvent?.event?.pathParameters || {};
            return `EMPLOYEES_${employeeId}`;
        },
    })
);
```

## Configuration Options

These are the available config options.

Except for `redisConfig`, all other config options can be set as default at global level, applicable to all routes,
or at a route level

```js
{
    // redis connection options, need to be defined in setDefaultConfig function
    //default: { socket: { host: "localhost", port: 6379 } }
    redisConfig: {
        socket: {
            host: <<REDIS HOST STRING>>,
            port: <<REDIS PORT>>
        }
    },

    // define when to skip caching the response, for example: skip caching when the controller returns empty response
    //default: (middyEvent: any) => !middyEvent?.response?.body
    skipCachingFunc: <<function returning boolean>>

    //define how to return response on cache hit
    //default: (cachedBody: string, middyEvent: any) => ({ statusCode: 200, body: cachedBody,})
    // cachedBody: JSON stringified cache stored in redis, middyEvent: middy middleware event object
    responseFunc: <<function returnng API Gateway response body>>

    //define the redis cache key
    //if function,
    //  - has access to middyEvent (middy middleware event)
    //  - example: (middyEvent: any) => { return `KEY_ ${middyEvent?.event?.pathParameters?.id}`}
    //default: "TEST_KEY"
    key: <<string or function>>

    //define expiry of redis cache key
    //default: 24 hours
    expire: <<time in seconds>>
}
```

## Redis Unavailability

If the redis server becomes unavailable, the `middy-redis-cache` object will emit errors but will not crash the app. The requests during this time will be bypass cache and will return fresh data

Once the redis recovers, the caching will begin working again.
