import { Event, Effect } from 'effector'
import { IRpcRequest, IRpcResponse } from '@room-project/rpc-core'

export interface IRpcServerTransport {
  readonly receive: Event<IRpcRequest>
  readonly send: Event<IRpcResponse>
  readonly open: Effect<void | any, void | any>
  readonly close: Effect<void | any, void | any>
}
