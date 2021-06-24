import { RedisOptions } from "ioredis";

export interface RpcChannels {
  request: string
  response: string
}

export interface RedisRpcOptions extends RedisOptions {
  id?: string;
  channels: RpcChannels,
}

export interface RpcRequest {
  method: string
  data: any
}

export interface RpcResponse {
  status: string
  data: any
}

export interface ResponseMessage {
  status: string
  client: string
  id: string
  data: any
}

export interface RequestMessage {
  method: string
  client: string
  id: string
  data: any
}