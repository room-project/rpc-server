import { Event, Effect, Store } from 'effector'
import { IRpcRequest, IRpcResponse } from '@room-project/rpc-core'

export interface IRpcServerTransport {
  readonly alive: Store<boolean>
  readonly receive: Event<IRpcRequest>
  readonly send: Event<IRpcResponse>
  readonly open: Effect<any, any>
  readonly close: Effect<any, any>
}
