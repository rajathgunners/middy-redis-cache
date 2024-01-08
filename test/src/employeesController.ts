import redisCacheMiddleware, { setDefaultConfig } from "@devraj95/middy-redis-cache";
const employeesData = require("../data/employeesData.json");
import middy from "@middy/core";

const delayForFiveSeconds = () => new Promise((res) => setTimeout(res, 5000));

const responseBody = (statusCode: number = 200, body: object = {}) => {
    return {
        statusCode: statusCode || 200,
        body: JSON.stringify(body),
    };
};

setDefaultConfig({
    skipCachingFunc: (middyEvent: any) =>
        middyEvent?.response?.body === "{}" || middyEvent?.response?.body === null,
    redisConfig: {
        password: "DXDn6gzWScqexLiJ8GJzfYqAH4eZ8Imv",
        socket: {
            host: "redis-12616.c325.us-east-1-4.ec2.cloud.redislabs.com",
            port: 12616,
        },
    },
});

export const getEmployees = middy(async (event) => {
    try {
        console.log("Inside getEmployees");

        await delayForFiveSeconds();

        const employees = Object.values(employeesData);

        return responseBody(200, employees);
    } catch (error: any) {
        console.log("Error in fetching employees data", error);
        return responseBody(400, error.message);
    }
}).use(redisCacheMiddleware({ key: "EMPLOYEES", expire: 30 * 60 }));

export const getEmployee = middy(async (event: any) => {
    try {
        const { employeeId = "" }: { employeeId: string } = event?.pathParameters;

        console.log(`Inside getEmployee Details for employeeId: ${employeeId}`);

        await delayForFiveSeconds();

        const employee = employeesData[employeeId] || {};

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

