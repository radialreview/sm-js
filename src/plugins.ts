import { computed, makeAutoObservable } from 'mobx'

export type SMPlugin = {
    DO?: {
        onConstruct?:(opts: {DOInstance: NodeDO, parsedDataKey: string})=> void
        computedDecorator?:<
            TReturnType,
            TComputedFn extends (data: Record<string,any>) => TReturnType
        >(opts: { DOInstance: NodeDO, computedFn: TComputedFn }) => () => TReturnType
    },
    DOProxy?: {
        computedDecorator?: <
            TReturnType,
            TComputedFn extends (data:Record<string,any>) => TReturnType
        >(opts: {ProxyInstance: IDOProxy, computedFn:TComputedFn}) => () => TReturnType
    }
}

export const mobxPlugin: SMPlugin = {
    DO: {
      onConstruct: ({DOInstance, parsedDataKey}) => {
        makeAutoObservable(DOInstance[parsedDataKey])
      },
      computedDecorator: ({DOInstance, computedFn}) => {
        return computed(() => computedFn(DOInstance)).get
      }
    },
    DOProxy: {
        computedDecorator: ({ProxyInstance, computedFn}) => {
            return computed(() => computedFn(ProxyInstance)).get
        }
    }
  }
  