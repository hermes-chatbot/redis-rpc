import { RedisOptions } from "ioredis";

export interface RpcChannels {
  request: string;
  response: string;
}

export interface RpcRequestOptions {
  timeout?: number;
}
export interface RedisRpcOptions extends RedisOptions {
  id?: string;
  channels?: RpcChannels;
}
export interface ResponseMessage {
  status: string;
  client: string;
  id: string;
  data: any;
}

export interface RequestMessage {
  method: string;
  client: string;
  id: string;
  data: any;
}
