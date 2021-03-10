import { createEvent, createStore, createEffect, Effect } from 'effector'
import express, { Response as ExpressResponse } from 'express'
import cors, { CorsOptions } from 'cors'
import http from 'http'
import { IRpcRequest, IRpcResponse, RpcMessageId } from '@room-project/rpc-core'
import { IRpcServerTransport } from '../transport'

export interface IRpcServerHttpTransportOptions {
  port: number
  cors?: CorsOptions
}

export interface IRpcServerHttpTransport extends IRpcServerTransport {
  open: Effect<void, void>
  close: Effect<void, void>
}

export interface IRpcServerHttpTransportFactory {
  (options: IRpcServerHttpTransportOptions): IRpcServerHttpTransport
  of: IRpcServerHttpTransportFactory
}

const parseRequest = (data: string): IRpcRequest => {
  try {
    return JSON.parse(data)
  } catch (error) {
    throw new Error(`Invalid request format`)
  }
}

export const RpcServerHttpTransportFactory: IRpcServerHttpTransportFactory = (options) => {
  const queue = new Map<RpcMessageId, ExpressResponse>()

  const app = express()
    .disable('x-powered-by')
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
  const alive = createStore<boolean>(false)

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

  open.use(() => {
    return new Promise((accept, reject) => {
      server.once('listening', () => accept())
      server.once('error', (error) => reject(error))
      server.listen(options.port)
    })
  })

  close.use(() => {
    return new Promise((accept) => {
      server.once('close', () => accept())
      server.close()
    })
  })

  open.done.watch(() => {
    console.log(`rpc-server, HTTP transport listening on port: ${options.port}`)
  })

  close.done.watch(() => {
    console.log(`rpc-server, HTTP transport closed`)
  })

  alive.on(open.done, () => true).reset(close.done)

  const transport: IRpcServerHttpTransport = {
    alive,
    receive,
    send,
    open,
    close,
  }

  return transport
}

RpcServerHttpTransportFactory.of = RpcServerHttpTransportFactory
