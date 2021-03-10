import { IRpcService, IRpcResponse } from '@room-project/rpc-core'
import { IRpcServerTransport } from './transport'

export interface IRpcServer<S extends IRpcService, T extends IRpcServerTransport> {
  readonly service: S
  readonly transport: T
}

export interface IRpcServerFactoryOptions<S extends IRpcService, T extends IRpcServerTransport> {
  service: S
  transport: T
}

export interface IRpcServerFactory {
  <S extends IRpcService, T extends IRpcServerTransport>(
    options: IRpcServerFactoryOptions<S, T>
  ): IRpcServer<S, T>
  of: IRpcServerFactory
}

export const RpcServerFactory: IRpcServerFactory = ({ service, transport }) => {
  Object.keys(service.methods).forEach((methodName) => {
    const method = service.methods[methodName]
    method.shortName = methodName
  })

  transport.receive.watch(async (request) => {
    const response = { id: request.id } as IRpcResponse
    try {
      const method = service.methods[request.name] || null
      if (!method) {
        throw new Error(`Method "${request.name}" not found`)
      }
      response.result = await method(request.params)
    } catch (reason) {
      response.error = {
        message: reason.message,
      }
    } finally {
      transport.send(response)
    }
  })

  transport.open.watch(() => {
    console.log(`rpc-server, starting...`)
  })

  transport.close.done.watch(() => {
    console.log(`rpc-server, stoped`)
  })

  const server = {
    service,
    transport,
  }

  return server
}

RpcServerFactory.of = RpcServerFactory
