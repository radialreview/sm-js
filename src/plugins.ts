import { computed, makeAutoObservable } from 'mobx'

export type SMPlugin = {
    DO?: {
        onConstruct?:(opts: {DOInstance: NodeDO<any,any,any,any>, parsedDataKey: string})=> void
        computedDecorator?:<
            TNodeData extends Record<string, ISMData>,
            TNodeComputedData,
            TReturnType,
            TComputedFn extends (data: GetExpectedNodeDataType<TNodeData> & TNodeComputedData) => TReturnType
        >(opts: { DOInstance: NodeDO<TNodeData,TNodeComputedData,any,any>, computedFn: TComputedFn }) => () => TReturnType
    },
    DOProxy?: {
        computedDecorator?: <
            TNodeData extends Record<string, ISMData>,
            TNodeComputedData,
            TReturnType,
            TComputedFn extends (data:GetExpectedNodeDataType<TNodeData> & TNodeComputedData) => TReturnType
        >(opts: {ProxyInstance: NodeDO<TNodeData,TNodeComputedData, any,any> & IDOProxy, computedFn:TComputedFn}) => () => TReturnType
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
  