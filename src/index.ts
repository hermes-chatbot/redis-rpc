import Redis, { Redis as IRedis } from "ioredis";
import { nanoid } from "nanoid";
import {
  RedisRpcOptions,
  RequestMessage,
  ResponseMessage,
  RpcChannels,
} from "./types";
import Emittery from "emittery";

type Event = `response-${string}` | `request`;
type Events = Record<Event, any>;
type Handler = (message: any) => any;

export const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export class RedisRPC {
  private id: string;
  private pub: IRedis;
  private sub: IRedis;
  private channels: RpcChannels;
  private event: Emittery<Events>;
  private handlers: Record<string, Handler>;

  constructor({ id, channels, ...redisOptions }: RedisRpcOptions) {
    this.id = id || nanoid();
    this.pub = new Redis(redisOptions);
    this.sub = new Redis(redisOptions);
    this.channels = channels;
    this.event = new Emittery();
    this.handlers = {};

    this.subscribe();
  }

  private subscribe() {
    this.sub.subscribe(...Object.values(this.channels));
    this.sub.on("message", async (channel, message) => {
      if (channel === this.channels.response) {
        const response = JSON.parse(message) as ResponseMessage;
        if (response.client === this.id) {
          this.event.emit(`response-${response.id}`, response);
        }
      }
      if (channel === this.channels.request) {
        const request = JSON.parse(message) as RequestMessage;
        if (Object.keys(this.handlers).includes(request.method)) {
          const response = await this.handleRequest(request);
          await this.publish(response);
        }
      }
    });
  }

  private async publish(data: ResponseMessage): Promise<void> {
    await this.pub.publish(this.channels.response, JSON.stringify(data));
  }

  private async handleRequest(
    request: RequestMessage
  ): Promise<ResponseMessage> {
    try {
      const handler = this.handlers[request.method];
      const responseData = await handler(request.data);
      return {
        data: responseData,
        status: "sucess",
        client: request.client,
        id: request.id,
      };
    } catch (error) {
      return {
        data: error.message,
        status: "error",
        client: request.client,
        id: request.id,
      };
    }
  }

  private waitResponse(id: string): Promise<ResponseMessage> {
    return Promise.race([
      this.event.once(`response-${id}`) as Promise<ResponseMessage>,
      sleep(2000).then(() => {
        throw new Error("RPC request timed out");
      }),
    ]);
  }

  public register(method: string, handler: Handler) {
    this.handlers[method] = handler;
  }

  public async call(method: string, data: any): Promise<ResponseMessage> {
    const requestId = nanoid();
    const request = {
      method,
      data,
      id: requestId,
      client: this.id,
    };
    await this.pub.publish(this.channels.request, JSON.stringify(request));
    const response = await this.waitResponse(requestId);
    return response;
  }
}
