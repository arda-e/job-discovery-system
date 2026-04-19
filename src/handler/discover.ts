import type { Handler } from "aws-lambda";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const handler: Handler = async () => {
  console.log("hello");
  await sleep(1_000);
  console.log("world");

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "ok" })
  };
};
