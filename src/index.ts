import { IRpcServerFactory, IRpcResponse } from '@room-project/rpc-core'

export * from './transports/http-transport'

/**
 *
 * @param options
 * @param options.service Сервис
 * @param options.transport Транспорт
 */
export const RpcServerFactory: IRpcServerFactory = ({ service, transport }) => {
  Object.keys(service.methods).forEach((methodName) => {
    const method = service.methods[methodName]
    method.shortName = methodName
  })

  transport.receive.watch(async (request) => {
    const response: IRpcResponse = { id: request.id }
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

  const server = {
    service,
    transport
  }

  return server
}

RpcServerFactory.of = RpcServerFactory
