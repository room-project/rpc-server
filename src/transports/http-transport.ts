import { createEvent, createEffect } from 'effector'
import express, { Response } from 'express'
import cors, { CorsOptions } from 'cors'
import http from 'http'
import {
  IRpcServerTransport,
  IRpcRequest,
  IRpcResponse,
  RpcMessageId,
} from '@room-project/rpc-core'

export interface IRpcServerHttpTransportOptions {
  port: number
  cors?: CorsOptions
}

export interface IRpcServerHttpTransportFactory {
  (options: IRpcServerHttpTransportOptions): IRpcServerTransport
  of: IRpcServerHttpTransportFactory
}

const parseRequest = (data: string): IRpcRequest => {
  try {
    const payload = JSON.parse(data)
    return payload
  } catch (error) {
    throw new Error(`Invalid request format`)
  }
}

export const RpcServerHttpTransportFactory: IRpcServerHttpTransportFactory = (options) => {
  const queue = new Map<RpcMessageId, Response>()

  const app = express()
    .use(
      cors({
        origin: '*',
        ...options.cors,
      })
    )
    .post('/', async (req, res) => {
      try {
        const request = parseRequest(req.body)
        queue.set(request.id, res)
        receive(request)
      } catch (error) {
        res.status(400).end()
      }
    })

  const server = http.createServer(app)

  const open = createEffect<void, void>('open')
  const close = createEffect<void, void>('close')

  const receive = createEvent<IRpcRequest>('receive')
  const send = createEvent<IRpcResponse>('send')

  send.watch((response) => {
    const res = queue.get(response.id)
    if (res) {
      res.status(200).json(response)
      queue.delete(response.id)
    }
  })

  open.use(async () => {
    server.listen(options.port)
  })

  close.use(async () => {
    server.close()
  })

  const transport: IRpcServerTransport = {
    receive,
    send,
    open,
    close,
  }

  return transport
}

RpcServerHttpTransportFactory.of = RpcServerHttpTransportFactory
