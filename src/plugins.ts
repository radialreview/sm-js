import { computed, makeAutoObservable } from 'mobx';

export const mobxPlugin: SMPlugin = {
  DO: {
    onConstruct: ({ DOInstance, parsedDataKey }) => {
      makeAutoObservable(DOInstance[parsedDataKey]);
    },
    computedDecorator: ({ DOInstance, computedFn }) => {
      return computed(() => computedFn(DOInstance)).get;
    },
  },
  DOProxy: {
    computedDecorator: ({ ProxyInstance, computedFn }) => {
      return computed(() => computedFn(ProxyInstance)).get;
    },
  },
};
