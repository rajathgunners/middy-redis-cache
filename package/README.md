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

        return responseBody(200, employee);
    } catch (error: any) {
        console.log("Error in fetching employees data", error);
        return responseBody(400, error.message);
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

Except for `redisConfig`, all other options can be set at default global level, applicable to all routes, or at a route level
