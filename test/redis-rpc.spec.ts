import test from "ava";
import { RedisRPC, sleep } from "../src";

const options = {
  channels: {
    request: "req",
    response: "res",
  },
};

const sum = (data: [number, number]) => {
  const [a, b] = data;
  return a + b;
};

const timeout = async () => {
  await sleep(3000);
};

const errored = async (data: any) => {
  throw new Error(`Error test - ${data}`);
};

test("should be able to register methods", (t) => {
  const rpc = new RedisRPC(options);
  t.notThrows(() => rpc.register("sum", sum));
});

test("should throw a error when the request times out", async (t) => {
  const rpc = new RedisRPC(options);
  rpc.register("timeout", timeout);
  await t.throwsAsync(rpc.call("timeout", "timeout"));
});

test("should return a response with error status when the handler fails", async (t) => {
  const rpc = new RedisRPC(options);
  rpc.register("error", errored);
  const response = await rpc.call("error", "error");
  t.is(response.status, "error");
});

test("should be able to call methods locally", async (t) => {
  const rpc = new RedisRPC(options);
  rpc.register("sum", sum);
  const result = await rpc.call("sum", [8, 2]);
  t.is(result.data, 10);
});
